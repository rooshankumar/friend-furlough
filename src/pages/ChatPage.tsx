import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useConnectionStatus, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { useConversationsPreloader } from '@/hooks/useDataPreloader';
import { SimpleMessage } from '@/components/chat/SimpleMessage';
import { EnhancedMessage } from '@/components/chat/EnhancedMessage';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { mobileFileHandler } from '@/lib/mobileFileHandler';
// Helper function to format last seen time
const getLastSeenText = (profile?: any): string => {
  // Check for real last seen data from database
  let lastSeen = profile?.last_seen || profile?.updated_at || profile?.created_at;
  
  // If no real timestamp, show "recently" instead of fake data
  if (!lastSeen) {
    return 'Last seen recently';
  }
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  
  // Validate the date
  if (isNaN(lastSeenDate.getTime())) {
    return 'Last seen recently';
  }
  
  const diffInMs = now.getTime() - lastSeenDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Handle future dates (shouldn't happen but just in case)
  if (diffInMs < 0) return 'Last seen just now';
  if (diffInMinutes < 1) return 'Last seen just now';
  if (diffInMinutes < 60) return `Last seen ${diffInMinutes}m ago`;
  if (diffInHours < 24) return `Last seen ${diffInHours}h ago`;
  if (diffInDays < 7) return `Last seen ${diffInDays}d ago`;
  
  return 'Last seen a while ago';
};

const ChatPage = () => {
  
  // Store data - get user from here
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  
  // Update user's last seen timestamp
  const updateLastSeen = async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to update last seen:', error);
    }
  };

  const [newMessage, setNewMessage] = useState('');
  const [messageReadStatus, setMessageReadStatus] = useState<{[messageId: string]: boolean}>({});
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { toast } = useToast();
  const { logEvent } = usePerformanceMonitor('ChatPage');
  const isOnline = useConnectionStatus();
  const { isMobile, isLowEndDevice, optimizeFileUpload } = useMobileOptimization();
  
  // Store data (user already declared above)
  const { 
    conversations, 
    messages,
    loadConversations, 
    loadMessages, 
    sendMessage, 
    sendAttachment,
    sendVoiceMessage,
    markMessageAsRead,
    markAsRead,
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

  const processOfflineMessages = useCallback(async () => {
    const queuedMessages = JSON.parse(localStorage.getItem('offline_messages') || '[]');
    
    if (queuedMessages.length === 0) return;
    
    console.log('📤 Processing offline messages:', queuedMessages.length);
    
    for (const queuedMsg of queuedMessages) {
      try {
        await sendMessage(queuedMsg.conversationId, queuedMsg.userId, queuedMsg.content);
        console.log('✅ Offline message sent:', queuedMsg.content.substring(0, 30));
      } catch (error) {
        console.error('❌ Failed to send offline message:', error);
        // Keep failed messages in queue for next attempt
        continue;
      }
    }
    
    // Clear the queue after processing
    localStorage.removeItem('offline_messages');
    
    toast({
      title: "Offline messages sent",
      description: `${queuedMessages.length} queued messages delivered`,
    });
    
    // Reload messages to show the sent ones
    if (conversationId) {
      setTimeout(() => loadMessages(conversationId), 200);
    }
  }, [sendMessage, conversationId, loadMessages, toast]);

  // Process offline queue when connection is restored
  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
      // Also process our simple offline message queue
      processOfflineMessages();
    }
  }, [isOnline, processOfflineQueue, processOfflineMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    const msg = newMessage.trim();
    setNewMessage('');
    
    console.log('🚀 [ChatPage] Attempting to send message:', {
      conversationId,
      userId: user.id,
      messagePreview: msg.substring(0, 30) + (msg.length > 30 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    try {
      const result = await sendMessage(conversationId, user.id, msg);
      
      console.log('✅ [ChatPage] Message sent successfully:', {
        success: true,
        resultId: result?.id,
        timestamp: new Date().toISOString()
      });
      
      logEvent('message_send_success');
    } catch (error: any) {
      console.error('❌ [ChatPage] Message send failed:', {
        error: error.message,
        conversationId,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      logEvent('message_send_error', { error: error.message });
      
      // Restore message to input on failure
      setNewMessage(msg);
      
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  }, [newMessage, conversationId, user, sendMessage, toast, logEvent]);

  const handleRetryMessage = useCallback(async (message: any) => {
    if (!conversationId || !user) return;

    try {
      // Update message status to sending
      updateMessageStatusById(message.id, conversationId, 'sending');
      
      // Retry sending the message
      await sendMessage(conversationId, user.id, message.content, message.media_url);
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
      
      // Force reload messages to ensure UI updates
      setTimeout(() => {
        loadMessages(conversationId);
      }, 100);
    } catch (error: any) {
      console.error('❌ Message retry failed:', error);
      
      // Update message status back to failed
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

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Broadcast that user is typing
    broadcastTyping(conversationId, user.id, profile.name || 'User', true);

    // Set timeout to stop typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      broadcastTyping(conversationId, user.id, profile.name || 'User', false);
    }, 3000);

    setTypingTimeout(timeout);
  }, [conversationId, user, profile, typingTimeout, broadcastTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      // Stop typing indicator when message is sent
      if (conversationId && user && profile && typingTimeout) {
        clearTimeout(typingTimeout);
        broadcastTyping(conversationId, user.id, profile.name || 'User', false);
        setTypingTimeout(null);
      }
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    console.log('📎 Attachment selected:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      conversationId,
      userId: user?.id,
      isMobile
    });
    
    if (!file || !conversationId || !user) {
      console.error('❌ Missing requirements:', { file: !!file, conversationId, user: !!user });
      toast({
        title: "Upload failed",
        description: "Missing file, conversation, or user information",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    // P0: attachments require connection (no resumable upload yet)
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Attachments require an internet connection.",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    console.log('✅ Starting attachment upload:', { fileName: file.name, fileSize: file.size });
    logEvent('attachment_upload_attempt', { fileName: file.name, fileSize: file.size });
    
    try {
      // Use mobile-optimized file upload
      let processedFile = file;
      
      if (isMobile) {
        console.log('📱 Mobile upload - optimizing file...');
        toast({
          title: "Processing file...",
          description: "Optimizing for mobile upload",
        });
        
        try {
          processedFile = await optimizeFileUpload(file);
          console.log('📱 File optimized:', {
            original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            optimized: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
          });
        } catch (optimizeError) {
          console.warn('📱 File optimization failed, using original:', optimizeError);
          processedFile = file;
        }
      }
      
      console.log('📤 Calling sendAttachment...');
      await sendAttachment(conversationId, user.id, processedFile);
      console.log('✅ Attachment upload complete');
      logEvent('attachment_upload_success', { fileName: file.name });
      
      // Simple success indicator - just a brief green tick
      const successDiv = document.createElement('div');
      successDiv.innerHTML = '✅';
      successDiv.style.cssText = 'position:fixed;top:20px;right:20px;font-size:24px;z-index:9999;animation:fadeInOut 2s forwards';
      document.body.appendChild(successDiv);
      setTimeout(() => document.body.removeChild(successDiv), 2000);
      
      // Add CSS animation if not exists
      if (!document.getElementById('fadeInOutStyle')) {
        const style = document.createElement('style');
        style.id = 'fadeInOutStyle';
        style.textContent = '@keyframes fadeInOut { 0% { opacity: 0; transform: scale(0.5); } 20% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }';
        document.head.appendChild(style);
      }
    } catch (error: any) {
      console.error('❌ Attachment upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      logEvent('attachment_upload_error', { error: error.message, fileName: file.name });
      
      let errorMessage = "Please try again";
      if (error.message?.includes('bucket')) {
        errorMessage = "Storage bucket not configured. Please contact support.";
      } else if (error.message?.includes('policy')) {
        errorMessage = "Permission denied. Please check your account permissions.";
      } else if (error.message?.includes('size')) {
        errorMessage = "File is too large. Please select a smaller file.";
      } else if (error.message?.includes('type')) {
        errorMessage = "File type not supported.";
      }
      
      toast({
        title: "Upload failed",
        description: `${error.message || errorMessage}`,
        variant: "destructive"
      });
    } finally {
      // Reset the input
      e.target.value = '';
    }
  };

  const handleVoiceRecording = async () => {
    if (!conversationId || !user) return;
    // P0: voice messages require connection (no resumable upload yet)
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Voice messages require an internet connection.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
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
        let isProcessing = false;

        recorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes', 'at', new Date().toLocaleTimeString());
          if (event.data.size > 0) {
            audioChunks.push(event.data);
            console.log('Total chunks collected:', audioChunks.length);
          }
        };

        recorder.onstop = async () => {
          if (isProcessing) return; // Prevent double processing
          isProcessing = true;
          
          console.log('Recording stopped at', new Date().toLocaleTimeString());
          console.log('Total chunks collected:', audioChunks.length);
          console.log('Chunk sizes:', audioChunks.map((chunk: any) => chunk.size));
          
          // Ensure we have audio data
          if (audioChunks.length === 0) {
            toast({
              title: "Recording failed",
              description: "No audio data captured.",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          // Create blob with explicit type
          const audioBlob = new Blob(audioChunks, { type: selectedMimeType });
          console.log('Final audio blob:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: audioChunks.length
          });
          
          // Validate blob size - reduced minimum to 500 bytes
          if (audioBlob.size < 500) {
            toast({
              title: "Recording too short",
              variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          try {
            await sendVoiceMessage(conversationId, user.id, audioBlob);
            
            // Simple success indicator - just a brief green tick with mic icon
            const successDiv = document.createElement('div');
            successDiv.innerHTML = '🎤✅';
            successDiv.style.cssText = 'position:fixed;top:20px;right:20px;font-size:20px;z-index:9999;animation:fadeInOut 2s forwards';
            document.body.appendChild(successDiv);
            setTimeout(() => document.body.removeChild(successDiv), 2000);
          } catch (error: any) {
            console.error('Voice message send error:', error);
            toast({
              title: "Failed to send voice message",
              variant: "destructive"
            });
          }

          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        // Start recording - use timeslice for consistent data collection
        // Using 250ms intervals for complete audio capture (critical for short recordings)
        recorder.start(250);
        console.log('Recording started with format:', selectedMimeType, 'with 250ms intervals');
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Start duration timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

      } catch (error) {
        console.error('Microphone access error:', error);
        toast({
          title: "Microphone access denied",
          variant: "destructive"
        });
      }
    }
  };
  
  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load message read status
  const loadMessageReadStatus = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    
    try {
      // Filter out temporary IDs (non-UUID) to avoid 400 errors from PostgREST
      const uuidIds = messageIds.filter(id => /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/.test(id));
      if (uuidIds.length === 0) return;

      const { data, error } = await supabase
        .from('message_reads')
        .select('message_id')
        .in('message_id', uuidIds)
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

  // Load read status when messages change (for own sent messages)
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

  // Auto-mark messages as read for the active conversation
  const markedIdsRef = useRef<Set<string>>(new Set());
  const isUUID = (id: string) => /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/.test(id);

  useEffect(() => {
    if (!conversationId || !user) return;
    if (!conversationMessages || conversationMessages.length === 0) return;

    const unreadFromOthers = conversationMessages.filter(m => m.sender_id !== user.id && isUUID(m.id));
    if (unreadFromOthers.length === 0) return;

    // Mark each message once
    unreadFromOthers.forEach(m => {
      if (!markedIdsRef.current.has(m.id)) {
        markedIdsRef.current.add(m.id);
        markMessageAsRead(m.id, user.id).catch(() => {});
      }
    });
    // Zero unread count for this conversation
    markAsRead(conversationId, user.id).catch(() => {});
  }, [conversationId, user, conversationMessages, markAsRead, markMessageAsRead]);

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
      <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0">
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
    <div className="h-screen md:ml-16 bg-gradient-subtle">
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
                    {otherParticipant?.profiles?.online ? 'Online' : getLastSeenText(otherParticipant?.profiles)}
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
            <div className="space-y-1">
              {conversationMessages.map((message, index) => {
                // Optimize date calculations
                const showDateSeparator = index === 0 || 
                  new Date(message.created_at).toDateString() !== 
                  new Date(conversationMessages[index - 1].created_at).toDateString();
                
                const isCurrentUser = message.sender_id === user?.id;

                return (
                  <div key={message.id} className="m-0 p-0">
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {new Date(message.created_at).toDateString()}
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
              })}

              {/* Typing Indicator - Just 3 dots */}
              {currentTypingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-accent text-accent-foreground rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input - Fixed at Bottom */}
          <div className="flex-shrink-0 border-t border-border/50 bg-background">
            {/* Recording Indicator */}
            {isRecording && (
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-destructive">Recording</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-background/50 rounded-full overflow-hidden flex items-center px-2">
                      {/* Animated waveform bars */}
                      <div className="flex items-center justify-center gap-0.5 w-full">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-destructive rounded-full transition-all duration-150"
                            style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animation: `pulse ${0.8 + Math.random() * 0.4}s ease-in-out infinite`,
                              animationDelay: `${i * 0.05}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-medium text-destructive min-w-[3rem] text-right">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 p-3">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 flex-shrink-0"
                disabled={isRecording || !isOnline}
                title={!isOnline ? 'Attachments require internet' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('📎 Attachment button clicked');
                  const input = document.getElementById('attachment-upload') as HTMLInputElement;
                  if (input) {
                    input.click();
                  }
                }}
              >
                <Image className="h-4 w-4" />
              </Button>
              <input
                id="attachment-upload"
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                capture="environment"
                className="hidden"
                onChange={handleAttachmentUpload}
                multiple={false}
                style={{ display: 'none' }}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
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
                disabled={!isOnline}
                title={!isOnline ? 'Voice requires internet' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🎤 Voice button clicked, isRecording:', isRecording);
                  handleVoiceRecording();
                }}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                disabled={!newMessage.trim() || isRecording}
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
