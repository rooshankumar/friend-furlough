import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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

  // Define conversation data first
  const currentConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : null;

  const conversationMessages = conversationId 
    ? messages[conversationId] || []
    : [];

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations(user.id);
    }
  }, [user, loadConversations]);

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (conversationId && user) {
      loadMessages(conversationId);
      markAsRead(conversationId, user.id);
      const channel = subscribeToMessages(conversationId);
      
      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[conversationId || '']]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      await sendMessage(conversationId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

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

    console.log('Starting attachment upload:', { fileName: file.name, fileSize: file.size, conversationId });
    
    // Show loading toast
    toast({
      title: "Uploading attachment...",
      description: `Sending ${file.name}...`
    });

    try {
      await sendAttachment(conversationId, user.id, file);
      toast({
        title: "Attachment sent!",
        description: `${file.name} has been sent successfully.`
      });
    } catch (error: any) {
      console.error('Attachment upload error:', error);
      toast({
        title: "Failed to send attachment",
        description: error.message || "Please try again",
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
            sampleRate: 44100
          }
        });
        
        // Try WAV format first (uncompressed, no codec issues)
        let recorder;
        let selectedMimeType = 'audio/wav';
        
        if (MediaRecorder.isTypeSupported('audio/wav')) {
          recorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });
          selectedMimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
          recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=pcm' });
          selectedMimeType = 'audio/webm;codecs=pcm';
        } else {
          // Fallback to default (usually webm with vorbis, not opus)
          recorder = new MediaRecorder(stream);
          selectedMimeType = recorder.mimeType || 'audio/webm';
        }
        
        console.log('Using audio format:', selectedMimeType);
        
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: selectedMimeType });
          
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
            toast({
              title: "Failed to send voice message",
              description: error.message || "Please try again",
              variant: "destructive"
            });
          }

          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start(1000); // Collect data every 1 second
        setMediaRecorder(recorder);
        setIsRecording(true);

        toast({
          title: "Recording started",
          description: "Tap the mic again to stop recording"
        });

      } catch (error) {
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
    
  const otherParticipant = currentConversation?.participants.find(
    p => p.user_id !== user?.id
  );

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
            <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation) => {
                      const otherUser = conversation.participants.find(p => p.user_id !== user?.id);
                      const participantProfile = otherUser?.profiles;
                      
                      return (
                        <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                          <div className="p-4 hover:bg-accent/50 cursor-pointer border-b border-border/50">
                            <div className="flex items-start space-x-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={participantProfile?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-cultural text-white">
                                    {participantProfile?.name?.[0] || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                {participantProfile?.online && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium truncate">
                                    {participantProfile?.name || 'Unknown User'}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {conversation.lastMessage ? formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true }).replace('about ', '') : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessage?.content || 'No messages yet'}
                                </p>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
            </div>
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
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find(p => p.user_id !== user?.id);
              const participantProfile = otherUser?.profiles;
              
              return (
                <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                  <div className={`p-3 hover:bg-accent/50 cursor-pointer border-b border-border/50 ${
                    conversation.id === conversationId ? 'bg-accent/50' : ''
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participantProfile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-cultural text-white">
                            {participantProfile?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {participantProfile?.online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate text-sm">
                            {participantProfile?.name || 'Unknown User'}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {conversation.lastMessage ? formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true }).replace('about ', '').replace(' ago', '') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
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
                const currentDate = new Date(message.created_at).toDateString();
                const previousDate = index > 0 
                  ? new Date(conversationMessages[index - 1].created_at).toDateString()
                  : null;
                const showDateSeparator = currentDate !== previousDate;
                const isLastMessage = index === conversationMessages.length - 1;
                const isLastUserMessage = message.sender_id === user?.id && 
                  conversationMessages.slice(index + 1).every(msg => msg.sender_id !== user?.id);
                
                // Clean attachment rendering without filename display

                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${message.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                      {/* Message content */}
                      <div className={`max-w-[75%] sm:max-w-[60%] ${
                        message.media_url && (message.type === 'image' || message.type === 'voice')
                          ? '' // No styling for images and voice messages
                          : `${message.sender_id === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent text-accent-foreground'
                            } rounded-2xl px-3 py-2`
                      }`}>
                        
                        {/* Attachment rendering */}
                        {message.media_url && (
                          <div>
                            {message.type === 'image' ? (
                              <img 
                                src={message.media_url} 
                                alt="Attachment" 
                                className="max-w-full h-auto cursor-pointer max-h-64 object-cover rounded-2xl"
                                onClick={() => window.open(message.media_url, '_blank')}
                                onError={(e) => {
                                  console.error('Image failed to load:', message.media_url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : message.type === 'voice' ? (
                              <div className="flex items-center gap-2 max-w-xs">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  🎤
                                </div>
                                <audio 
                                  controls 
                                  className="flex-1"
                                  preload="metadata"
                                  src={message.media_url}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-background/10 rounded-lg cursor-pointer hover:bg-background/20 transition-colors"
                                   onClick={() => window.open(message.media_url, '_blank')}>
                                <div className="w-10 h-10 bg-background/20 rounded-lg flex items-center justify-center">
                                  📎
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.content}</p>
                                  <p className="text-xs opacity-70">Click to download</p>
                                </div>
                                <div className="text-xs opacity-50">⬇️</div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Text content - hide for attachments */}
                        {!message.media_url && (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>

                      {/* Status indicators below the message */}
                      {message.sender_id === user?.id && isLastUserMessage && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs opacity-70 text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {messageReadStatus[message.id] ? (
                            <CheckCheck className="h-3 w-3 text-green-500" />
                          ) : (
                            <Check className="h-3 w-3 opacity-70 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      
                      {/* Timestamp for received messages - below message */}
                      {message.sender_id !== user?.id && isLastMessage && (
                        <div className="mt-1">
                          <span className="text-xs opacity-70 text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
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
