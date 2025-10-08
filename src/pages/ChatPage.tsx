import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConnectionStatus, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { useConversationsPreloader } from '@/hooks/useDataPreloader';
import { SimpleMessage } from '@/components/chat/SimpleMessage';
import { OptimizedConversationList } from '@/components/chat/OptimizedConversationList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Mic, 
  Image, 
  Globe,
  MoreVertical,
  Search,
  Trash2,
  Ban,
  Flag,
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const ChatPage = () => {
  const { conversationId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [messageReadStatus, setMessageReadStatus] = useState<{[messageId: string]: boolean}>({});
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Performance monitoring and connection status
  const { logEvent } = usePerformanceMonitor('ChatPage');
  const isOnline = useConnectionStatus();
  
  // Preload conversations data
  useConversationsPreloader();
  
  const { 
    conversations, 
    messages, 
    sendMessage, 
    sendAttachment,
    sendVoiceMessage,
    loadConversations,
    loadMessages,
    markAsRead,
    markMessageAsRead,
    subscribeToMessages,
    unsubscribeFromMessages
  } = useChatStore();
  
  const { user, profile } = useAuthStore();

  // Memoize expensive computations
  const currentConversation = useMemo(() => 
    conversationId ? conversations.find(c => c.id === conversationId) : null,
    [conversationId, conversations]
  );

  const conversationMessages = useMemo(() => 
    conversationId ? messages[conversationId] || [] : [],
    [conversationId, messages]
  );

  const otherParticipant = useMemo(() => 
    currentConversation?.participants.find(p => p.user_id !== user?.id),
    [currentConversation?.participants, user?.id]
  );

  // Load conversations on mount - memoized to prevent excessive calls
  useEffect(() => {
    if (user?.id && conversations.length === 0) {
      logEvent('loading_conversations', { userId: user.id });
      loadConversations(user.id);
    }
  }, [user?.id, conversations.length, loadConversations, logEvent]);

  // Load messages and subscribe to real-time updates - debounced
  useEffect(() => {
    if (!conversationId || !user) return;

    const timeoutId = setTimeout(() => {
      logEvent('loading_messages', { conversationId });
      loadMessages(conversationId);
      markAsRead(conversationId, user.id);
      const channel = subscribeToMessages(conversationId);
      
      return () => {
        unsubscribeFromMessages();
      };
    }, 100); // Small delay to debounce rapid navigation

    return () => {
      clearTimeout(timeoutId);
      unsubscribeFromMessages();
    };
  }, [conversationId, user?.id, loadMessages, markAsRead, subscribeToMessages, unsubscribeFromMessages, logEvent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[conversationId || '']]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    // Check connection before sending
    if (!isOnline) {
      toast({
        title: "No connection",
        description: "Please check your internet connection and try again",
        variant: "destructive"
      });
      return;
    }

    logEvent('message_send_attempt', { messageLength: newMessage.trim().length });

    try {
      await sendMessage(conversationId, user.id, newMessage.trim());
      setNewMessage('');
      logEvent('message_send_success');
    } catch (error: any) {
      logEvent('message_send_error', { error: error.message });
      toast({
        title: "Failed to send message",
        description: isOnline ? "Please try again" : "Connection lost. Please try again when online.",
        variant: "destructive"
      });
    }
  }, [newMessage, conversationId, user, isOnline, sendMessage, toast, logEvent]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) {
      console.log('Missing requirements:', { file: !!file, conversationId, user: !!user });
      return;
    }

    // Check connection before uploading
    if (!isOnline) {
      toast({
        title: "No connection",
        description: "Please check your internet connection before uploading files",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    console.log('Starting attachment upload:', { fileName: file.name, fileSize: file.size, conversationId });
    logEvent('attachment_upload_attempt', { fileName: file.name, fileSize: file.size });
    
    // Show loading toast
    toast({
      title: "Uploading attachment...",
      description: `Sending ${file.name}...`
    });

    try {
      await sendAttachment(conversationId, user.id, file);
      logEvent('attachment_upload_success', { fileName: file.name });
      toast({
        title: "Attachment sent!",
        description: `${file.name} has been sent successfully.`
      });
    } catch (error: any) {
      console.error('Attachment upload error:', error);
      logEvent('attachment_upload_error', { error: error.message, fileName: file.name });
      toast({
        title: "Failed to send attachment",
        description: error.message || (isOnline ? "Please try again" : "Connection lost. Please try again when online."),
        variant: "destructive"
      });
    }
    
    // Reset the input
    e.target.value = '';
  };

  const handleVoiceRecording = async () => {
    if (!conversationId || !user) return;

    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
            channelCount: 1 // Mono recording for smaller file size
          }
        });
        
        // Improved format selection with better compatibility
        let recorder;
        let selectedMimeType = 'audio/webm';
        
        // Priority order: WebM with Opus (best compression), WebM with Vorbis, WAV (largest but most compatible)
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 64000 // Good quality for voice
          });
          selectedMimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm',
            audioBitsPerSecond: 64000
          });
          selectedMimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          recorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });
          selectedMimeType = 'audio/wav';
        } else {
          // Fallback to default
          recorder = new MediaRecorder(stream);
          selectedMimeType = recorder.mimeType || 'audio/webm';
        }
        
        console.log('Using audio format:', selectedMimeType);
        
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          console.log('Recording stopped, total chunks:', audioChunks.length);
          
          // Ensure we have audio data
          if (audioChunks.length === 0) {
            toast({
              title: "Recording failed",
              description: "No audio data was captured. Please try again.",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          const audioBlob = new Blob(audioChunks, { type: selectedMimeType });
          console.log('Final audio blob size:', audioBlob.size, 'bytes');
          
          // Validate blob size
          if (audioBlob.size < 1000) { // Less than 1KB is likely corrupted
            toast({
              title: "Recording too short",
              description: "Please record for at least 1 second.",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          try {
            toast({
              title: "Sending voice message...",
              description: "Please wait while we upload your recording."
            });

            await sendVoiceMessage(conversationId, user.id, audioBlob);
            
            toast({
              title: "Voice message sent!",
              description: "Your voice message has been delivered."
            });
          } catch (error: any) {
            console.error('Voice message send error:', error);
            toast({
              title: "Failed to send voice message",
              description: error.message || "Please try again",
              variant: "destructive"
            });
          }

          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        // Start recording with more frequent data collection for better reliability
        recorder.start(250); // Collect data every 250ms for smoother recording
        setMediaRecorder(recorder);
        setIsRecording(true);

        toast({
          title: "Recording started",
          description: "Tap the mic again to stop recording"
        });

      } catch (error) {
        console.error('Microphone access error:', error);
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to send voice messages",
          variant: "destructive"
        });
      }
    }
  };

  // Load message read status
  const loadMessageReadStatus = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('message_reads')
        .select('message_id')
        .in('message_id', messageIds)
        .neq('user_id', user.id); // Get reads by other users
      
      if (error) {
        console.error('Error loading message read status:', error);
        return;
      }
      
      const readStatusMap: {[messageId: string]: boolean} = {};
      messageIds.forEach(id => {
        readStatusMap[id] = data?.some(read => read.message_id === id) || false;
      });
      
      setMessageReadStatus(readStatusMap);
    } catch (error) {
      console.error('Error loading message read status:', error);
    }
  };

  // Load read status when messages change
  useEffect(() => {
    if (conversationMessages.length > 0 && user) {
      const userMessageIds = conversationMessages
        .filter(msg => msg.sender_id === user.id)
        .map(msg => msg.id);
      
      if (userMessageIds.length > 0) {
        loadMessageReadStatus(userMessageIds);
      }
    }
  }, [conversationMessages, user]);

  // Mark received messages as read when they're loaded - DISABLED due to RLS issues
  // useEffect(() => {
  //   if (conversationMessages.length > 0 && user) {
  //     const unreadMessages = conversationMessages
  //       .filter(msg => msg.sender_id !== user.id)
  //       .slice(-5); // Mark last 5 received messages as read
      
  //     unreadMessages.forEach(message => {
  //       markMessageAsRead(message.id, user.id);
  //     });
  //   }
  // }, [conversationMessages, user, markMessageAsRead]);

  if (!conversationId) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
          {/* Conversations List */}
          <div className="md:w-96 border-r border-border/50 bg-card/30 h-full flex flex-col">
            <div className="pb-4 p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Conversations
                </h2>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <OptimizedConversationList
              conversations={conversations}
              currentUserId={user?.id}
              isDesktop={false}
            />
          </div>

          {/* Welcome Message - Only show on desktop or when no conversations */}
          {(conversations.length === 0 || window.innerWidth >= 768) && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto bg-gradient-cultural rounded-full flex items-center justify-center">
                  <Globe className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Start Cultural Conversations
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Select a conversation to start practicing languages and sharing cultures with friends around the world.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle">
      <div className="h-full flex">
        {/* Conversations List - Desktop Only */}
        <div className="hidden lg:flex lg:w-72 border-r border-border/50 bg-card/30 flex-col flex-shrink-0">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Chats
              </h2>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <OptimizedConversationList
            conversations={conversations}
            currentUserId={user?.id}
            activeConversationId={conversationId}
            isDesktop={true}
          />
        </div>
        <div className="flex-1 bg-background flex flex-col h-full">
          {/* Chat Header - Fixed */}
          <div className="flex-shrink-0 border-b border-border/50 py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link to="/chat" className="lg:hidden">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-cultural text-white">
                      {otherParticipant?.profiles?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {otherParticipant?.profiles?.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{otherParticipant?.profiles?.name || 'Unknown User'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {otherParticipant?.profiles?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-destructive cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Conversation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-2">
              {conversationMessages.map((message, index) => {
                // Optimize date calculations
                const showDateSeparator = index === 0 || 
                  new Date(message.created_at).toDateString() !== 
                  new Date(conversationMessages[index - 1].created_at).toDateString();
                
                const isLastMessage = index === conversationMessages.length - 1;
                const isCurrentUser = message.sender_id === user?.id;
                
                // Simplified last user message check
                const isLastUserMessage = isCurrentUser && (
                  index === conversationMessages.length - 1 ||
                  conversationMessages[index + 1]?.sender_id !== user?.id
                );

                return (
                  <SimpleMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    showDateSeparator={showDateSeparator}
                    isLastMessage={isLastMessage}
                    isLastUserMessage={isLastUserMessage}
                    messageReadStatus={messageReadStatus[message.id] || false}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input - Fixed at Bottom */}
          <div className="flex-shrink-0 p-3 border-t border-border/50 bg-background">
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 flex-shrink-0"
                onClick={() => document.getElementById('attachment-upload')?.click()}
              >
                <Image className="h-4 w-4" />
              </Button>
              <input
                id="attachment-upload"
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleAttachmentUpload}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="h-9 text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck="true"
                />
              </div>
              <Button 
                size="sm" 
                variant={isRecording ? "destructive" : "ghost"} 
                className={`h-9 w-9 p-0 flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                onClick={handleVoiceRecording}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
