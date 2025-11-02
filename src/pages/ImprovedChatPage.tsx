import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { OptimizedConversationList } from '@/components/chat/OptimizedConversationList';
import { EnhancedMessage } from '@/components/chat/EnhancedMessage';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { EmptyState } from '@/components/chat/EmptyState';
import { Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ImprovedChatPage = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  usePerformanceMonitor('ImprovedChatPage');
  const connectionStatus = useConnectionStatus();
  const isOnline = typeof connectionStatus === 'boolean' ? connectionStatus : connectionStatus.isOnline;

  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    conversations, 
    messages,
    loadConversations, 
    loadMessages, 
    sendMessage, 
    sendAttachment,
    sendVoiceMessage,
    markAsRead,
    markMessageAsRead,
    subscribeToMessages, 
    unsubscribeFromMessages,
    broadcastTyping,
    processOfflineQueue,
    updateMessageStatusById,
    typingUsers
  } = useChatStore();

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

  const currentTypingUsers = useMemo(() => {
    if (!conversationId || !typingUsers[conversationId]) return [];
    return Object.entries(typingUsers[conversationId])
      .filter(([userId]) => userId !== user?.id)
      .map(([_, userName]) => userName);
  }, [conversationId, typingUsers, user?.id]);

  // Update user's last seen timestamp
  const updateLastSeen = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          online: true
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to update last seen:', error);
    }
  }, [user?.id]);

  // Update last seen on mount and periodically
  useEffect(() => {
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Every minute
    return () => clearInterval(interval);
  }, [updateLastSeen]);

  // Set offline when unmounting
  useEffect(() => {
    return () => {
      if (user?.id) {
        supabase
          .from('profiles')
          .update({ online: false })
          .eq('id', user.id)
          .then(() => {});
      }
    };
  }, [user?.id]);

  // Load conversations
  useEffect(() => {
    if (user?.id && conversations.length === 0) {
      loadConversations(user.id);
    }
  }, [user?.id, conversations.length, loadConversations]);

  // Load messages and subscribe
  useEffect(() => {
    if (!conversationId || !user) return;

    const timeoutId = setTimeout(() => {
      loadMessages(conversationId);
      markAsRead(conversationId, user.id);
      subscribeToMessages(conversationId);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      unsubscribeFromMessages();
    };
  }, [conversationId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Process offline queue
  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  // Auto-mark messages as read
  useEffect(() => {
    if (!conversationId || !user || conversationMessages.length === 0) return;

    const unreadFromOthers = conversationMessages.filter(
      m => m.sender_id !== user.id && /^[0-9a-fA-F-]{36}$/.test(m.id)
    );

    unreadFromOthers.forEach(m => {
      markMessageAsRead(m.id, user.id).catch(() => {});
    });
  }, [conversationId, user, conversationMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    const msg = newMessage.trim();
    setNewMessage('');
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      broadcastTyping(conversationId, user.id, profile?.name || 'User', false);
      setTypingTimeout(null);
    }

    try {
      await sendMessage(conversationId, user.id, msg);
    } catch (error: any) {
      setNewMessage(msg);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  }, [newMessage, conversationId, user, profile, sendMessage, broadcastTyping, typingTimeout, toast]);

  const handleRetryMessage = useCallback(async (message: any) => {
    if (!conversationId || !user) return;

    try {
      updateMessageStatusById(message.id, conversationId, 'sending');
      await sendMessage(conversationId, user.id, message.content, message.media_url);
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
      
      setTimeout(() => loadMessages(conversationId), 100);
    } catch (error: any) {
      updateMessageStatusById(message.id, conversationId, 'failed');
      toast({
        title: "Retry failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  }, [conversationId, user, sendMessage, updateMessageStatusById, toast, loadMessages]);

  const handleTyping = useCallback(() => {
    if (!conversationId || !user || !profile) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    broadcastTyping(conversationId, user.id, profile.name || 'User', true);

    const timeout = setTimeout(() => {
      broadcastTyping(conversationId, user.id, profile.name || 'User', false);
    }, 3000);

    setTypingTimeout(timeout);
  }, [conversationId, user, profile, typingTimeout, broadcastTyping]);

  const handleAttachment = async (file: File) => {
    if (!conversationId || !user) return;

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Attachments require an internet connection.",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Uploading...",
        description: `Sending ${file.name}`,
      });
      
      await sendAttachment(conversationId, user.id, file);
      
      toast({
        title: "Sent!",
        description: "Attachment uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload attachment",
        variant: "destructive"
      });
    }
  };

  const handleVoiceRecord = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Voice messages require an internet connection.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        });
        
        let selectedMimeType = 'audio/webm';
        let recorder;
        
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 64000
          });
          selectedMimeType = 'audio/webm;codecs=opus';
        } else {
          recorder = new MediaRecorder(stream);
          selectedMimeType = recorder.mimeType || 'audio/webm';
        }
        
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (audioChunks.length === 0) {
            toast({
              title: "Recording failed",
              description: "No audio data captured.",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          const audioBlob = new Blob(audioChunks, { type: selectedMimeType });
          
          if (audioBlob.size < 500) {
            toast({
              title: "Recording too short",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          try {
            if (conversationId && user) {
              await sendVoiceMessage(conversationId, user.id, audioBlob);
              toast({
                title: "Voice message sent",
              });
            }
          } catch (error: any) {
            toast({
              title: "Failed to send voice message",
              variant: "destructive"
            });
          }

          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start(250);
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingDuration(0);
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

      } catch (error) {
        toast({
          title: "Microphone access denied",
          variant: "destructive"
        });
      }
    }
  };

  // No conversation selected view
  if (!conversationId) {
    return (
      <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
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

  // Chat view
  return (
    <div className="h-screen bg-gradient-subtle md:ml-16 flex flex-col">
      {/* Conversations List - Desktop Only */}
      <div className="hidden lg:flex lg:w-72 border-r border-border/50 bg-card/30 flex-col flex-shrink-0 h-full overflow-hidden">
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

      {/* Chat Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Wallpaper Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: "url('/wallpapers/chat-wallpaper.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Header */}
        <ChatHeader
          otherParticipant={otherParticipant}
          onBack={() => navigate('/chat')}
          onBlock={() => toast({ title: "Block feature coming soon" })}
          onReport={() => toast({ title: "Report feature coming soon" })}
          onDelete={() => toast({ title: "Delete feature coming soon" })}
        />

        {/* Messages Area */}
        <div className="flex-1 relative z-10 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 pb-24">
            <div className="space-y-2 min-h-full flex flex-col justify-end">
              {conversationMessages.length === 0 ? (
                <EmptyState otherParticipant={otherParticipant} />
              ) : (
                conversationMessages.map((message, index) => {
                  const showDateSeparator = index === 0 || 
                    new Date(message.created_at).toDateString() !== 
                    new Date(conversationMessages[index - 1].created_at).toDateString();
                  
                  const isCurrentUser = message.sender_id === user?.id;

                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <EnhancedMessage
                        message={message}
                        isOwnMessage={isCurrentUser}
                        showAvatar={!isCurrentUser}
                        otherUser={otherParticipant?.profiles}
                        onRetry={handleRetryMessage}
                      />
                    </div>
                  );
                })
              )}

              <TypingIndicator userNames={currentTypingUsers} />
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* Input */}
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          onAttachment={handleAttachment}
          onVoiceRecord={handleVoiceRecord}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isOnline={isOnline}
          onTyping={handleTyping}
        />
      </div>
    </div>
  );
};

export default ImprovedChatPage;
