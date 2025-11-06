/**
 * ChatPage V2.0 - Upgraded Modern Design
 * 
 * Key Improvements:
 * - Modern Telegram-style blue bubbles
 * - Enhanced header with language badges
 * - Message reactions support
 * - Swipe to reply (mobile)
 * - Better accessibility
 * - Smooth animations
 * - Improved mobile UX
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useMessageDeduplication } from '@/hooks/useMessageDeduplication';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { OptimizedConversationList } from '@/components/chat/OptimizedConversationList';
import { ChatErrorBoundary } from '@/components/ErrorBoundary';
import { VoiceMessagePlayer } from '@/components/chat/VoiceMessagePlayer';
import { DeleteConversationDialog } from '@/components/chat/DeleteConversationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Globe,
  MoreVertical,
  Search,
  Trash2,
  Ban,
  Flag,
  ArrowLeft,
  Info,
  Smile,
  Paperclip,
  X,
  Play,
  Pause,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toastNotifications } from '@/lib/toastNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';

// Enhanced Message Component with Reactions
interface EnhancedMessageV2Props {
  message: any;
  isOwnMessage: boolean;
  otherUser?: any;
  onRetry?: (message: any) => void;
  onReact?: (messageId: string, reaction: string) => void;
  onReply?: (message: any) => void;
  onCopy?: (content: string) => void;
  onDelete?: (messageId: string) => void;
}

const EnhancedMessageV2: React.FC<EnhancedMessageV2Props> = ({
  message,
  isOwnMessage,
  otherUser,
  onRetry,
  onReact,
  onReply,
  onCopy,
  onDelete
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Only allow swipe right (positive diff) and max 60px
    if (diff > 0 && diff <= 60) {
      setSwipeX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX > 40) {
      // Trigger reply
      onReply?.(message);
    }
    setSwipeX(0);
  };

  return (
    <div 
      className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s' : 'none' }}
    >
      {/* Reply Icon (shows on swipe) */}
      {swipeX > 20 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
      )}
      {/* Avatar for received messages */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 mt-auto">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-gradient-cultural text-white text-xs">
            {otherUser?.name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] relative`}>
        {/* Image Message */}
        {message.type === 'image' ? (
          <div className="relative group">
            {message.media_url ? (
              <img 
                src={message.media_url} 
                alt="Shared image"
                loading="lazy"
                decoding="async"
                className="max-w-xs w-full h-auto max-h-64 object-cover rounded-2xl shadow-md"
              />
            ) : (
              // Placeholder while uploading
              <div className="w-48 h-48 bg-muted/20 rounded-2xl flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {/* Upload Progress Overlay */}
            {message.status === 'sending' && message.uploadProgress !== undefined && message.uploadProgress < 100 && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="relative inline-flex items-center justify-center" style={{ width: 48, height: 48 }}>
                  <svg className="absolute transform -rotate-90" width={48} height={48}>
                    <circle cx={24} cy={24} r={20} stroke="currentColor" strokeWidth={4} fill="none" className="text-white opacity-20" />
                    <circle 
                      cx={24} 
                      cy={24} 
                      r={20} 
                      stroke="currentColor" 
                      strokeWidth={4} 
                      fill="none" 
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 - (message.uploadProgress / 100) * 2 * Math.PI * 20}
                      strokeLinecap="round"
                      className="text-white transition-all duration-300 ease-out"
                    />
                  </svg>
                  <span className="absolute font-semibold text-[10px] text-white">
                    {Math.round(message.uploadProgress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : message.type === 'voice' && message.media_url ? (
          /* Voice Message - Modern Waveform */
          <VoiceMessagePlayer 
            audioUrl={message.media_url}
            isOwnMessage={isOwnMessage}
          />
        ) : (
          /* Text Message Bubble */
          <div
            className={`relative rounded-2xl px-3 py-2 ${
              isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'
            } transition-all duration-200 hover:shadow-md`}
            style={{
              backgroundColor: isOwnMessage ? '#0B93F6' : '#F0F0F0',
              color: isOwnMessage ? '#FFFFFF' : '#1C1E21',
            }}
          >
            {/* Replied Message Preview - Inside Bubble */}
            {message.reply_to && (
              <div className={`mb-2 px-2 py-1.5 rounded text-xs border-l-4 flex items-center gap-2 ${
                isOwnMessage 
                  ? 'bg-white/10 border-white/40' 
                  : 'bg-black/5 border-primary/60'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-0.5 opacity-90">{message.reply_to.sender_name || 'User'}</p>
                  <p className="truncate flex items-center gap-1 opacity-80">
                    {message.reply_to.type === 'image' && '📷 Photo'}
                    {message.reply_to.type === 'voice' && '🎤 Voice message'}
                    {message.reply_to.type === 'file' && '📎 File'}
                    {message.reply_to.type === 'text' && message.reply_to.content}
                  </p>
                </div>
                {message.reply_to.type === 'image' && message.reply_to.media_url && (
                  <img 
                    src={message.reply_to.media_url} 
                    alt="" 
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                )}
              </div>
            )}

            {/* Message Content */}
            <p className="text-sm leading-relaxed pr-16 whitespace-pre-wrap">
              {message.content}
            </p>

            {/* Time and Status */}
            <div 
              className="absolute bottom-1 right-2 flex items-center gap-1"
              style={{
                color: isOwnMessage ? 'rgba(255,255,255,0.8)' : 'rgba(28,30,33,0.6)'
              }}
            >
              <span className="text-[10px]">
                {new Date(message.created_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
              {isOwnMessage && (
                <span className="text-xs">
                  {message.status === 'sending' && '○'}
                  {message.status === 'delivered' && '✓'}
                  {message.status === 'read' && '✓✓'}
                  {message.status === 'failed' && '✕'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Reply Action (Desktop Hover) */}
        <div className="hidden md:flex absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform"
            onClick={() => onReply?.(message)}
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Chat Page Component
const ChatPageV2 = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  const isOnline = useConnectionStatus();
  
  // Message deduplication
  const { generateClientId, isDuplicate, markAsSent, clearMessage } = useMessageDeduplication();
  
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Pull-to-refresh for messages
  const messagesPullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      if (conversationId) {
        await loadMessages(conversationId);
        toast({ title: 'Messages refreshed' });
      }
    },
    threshold: 80,
    disabled: !conversationId
  });
  
  // Pull-to-refresh for conversations
  const conversationsPullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      if (user) {
        await loadConversations(user.id);
        toast({ title: 'Conversations refreshed' });
      }
    },
    threshold: 80
  });
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    conversations, 
    messages,
    loadConversations, 
    loadMessages, 
    sendMessage,
    sendAttachment,
    sendVoiceMessage,
    markAsRead,
    subscribeToMessages, 
    unsubscribeFromMessages,
    deleteConversation,
  } = useChatStore();

  const currentConversation = useMemo(() => 
    conversationId ? conversations.find(c => c.id === conversationId) : null,
    [conversationId, conversations]
  );

  const conversationMessages = useMemo(() => 
    conversationId ? messages[conversationId] || [] : [],
    [conversationId, messages]
  );

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return conversationMessages;
    const query = searchQuery.toLowerCase();
    return conversationMessages.filter(msg => 
      msg.content?.toLowerCase().includes(query)
    );
  }, [conversationMessages, searchQuery]);

  const otherParticipant = useMemo(() => 
    currentConversation?.participants.find(p => p.user_id !== user?.id),
    [currentConversation?.participants, user?.id]
  );

  // Load conversations and messages
  useEffect(() => {
    if (user?.id && conversations.length === 0) {
      loadConversations(user.id);
    }
  }, [user?.id, conversations.length, loadConversations]);

  useEffect(() => {
    if (!conversationId || !user) return;

    loadMessages(conversationId);
    markAsRead(conversationId, user.id);
    const channel = subscribeToMessages(conversationId);
    
    return () => {
      unsubscribeFromMessages();
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    // Generate client ID for deduplication
    const clientId = generateClientId(conversationId);
    
    // Check for duplicate
    if (isDuplicate(clientId)) {
      toast({
        title: "Message already sent",
        description: "This message is being processed",
      });
      return;
    }

    const msg = newMessage.trim();
    const replyTo = replyingTo;
    setNewMessage('');
    setReplyingTo(null);
    
    // Mark as sent to prevent duplicates
    markAsSent(clientId, conversationId);
    
    try {
      await sendMessage(conversationId, user.id, msg, undefined, undefined, replyTo?.id);
    } catch (error: any) {
      // Clear from deduplication on error to allow retry
      clearMessage(clientId);
      setNewMessage(msg);
      setReplyingTo(replyTo);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  }, [newMessage, conversationId, user, replyingTo, sendMessage, toast, generateClientId, isDuplicate, markAsSent, clearMessage]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

  const handleReact = (messageId: string, reaction: string) => {
    // TODO: Implement reaction storage
    console.log('React:', messageId, reaction);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      toast({
        title: "Deleted",
        description: "Message deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file || !conversationId || !user) {
      toast({
        title: "Upload failed",
        description: "Missing file, conversation, or user information",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }
    
    // Basic file size validation (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Attachments require an internet connection.",
        variant: "destructive"
      });
      e.target.value = '';
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
        description: error.message || 'Failed to upload attachment. Please try again.',
        variant: "destructive"
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleVoiceRecording = async () => {
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
            channelCount: 1
          }
        });
        
        let recorder;
        let selectedMimeType = 'audio/webm';
        
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 64000
          });
          selectedMimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm',
            audioBitsPerSecond: 64000
          });
          selectedMimeType = 'audio/webm';
        } else {
          recorder = new MediaRecorder(stream);
          selectedMimeType = recorder.mimeType || 'audio/webm';
        }
        
        const audioChunks: BlobPart[] = [];
        let isProcessing = false;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (isProcessing) return;
          isProcessing = true;
          
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
            await sendVoiceMessage(conversationId, user.id, audioBlob);
            toast({
              title: "Voice message sent!",
            });
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

  const handleDeleteConversation = async (convId: string) => {
    if (!user?.id) return;

    setIsDeleting(true);
    try {
      await deleteConversation(convId, user.id);
      
      toastNotifications.success('Conversation deleted', 'The conversation has been removed from your chat list');
      
      setDeleteDialogOpen(false);
      
      // Navigate back to chat list
      navigate('/chat');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toastNotifications.error('Failed to delete', 'Could not delete the conversation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // No conversation selected view
  if (!conversationId) {
    return (
      <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
          {/* Conversations List */}
          <div className="md:w-96 border-r border-border/50 bg-card/30 h-full flex flex-col">
            {/* Compact Header - Mobile Optimized */}
            <div className="p-2 md:p-4 border-b border-border/50">
              {/* Mobile: Just search bar | Desktop: Title + search */}
              <div className="md:flex md:items-center md:justify-between md:mb-3 hidden">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="h-6 w-6 text-primary" />
                  Chats
                </h2>
              </div>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search chats..."
                  className="pl-9 bg-background/50 h-9 md:h-10 text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <ChatErrorBoundary
              fallbackTitle="Conversations Error"
              fallbackMessage="Unable to load conversations list"
              onReset={() => user?.id && loadConversations(user.id)}
            >
              <OptimizedConversationList
                conversations={conversations}
                currentUserId={user?.id}
                isDesktop={false}
              />
            </ChatErrorBoundary>
          </div>

          {/* Welcome Message */}
          {(conversations.length === 0 || window.innerWidth >= 768) && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center space-y-6 p-8 max-w-md">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Globe className="h-16 w-16 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Start Conversations
                  </h2>
                  <p className="text-muted-foreground">
                    Connect with language partners and practice together
                  </p>
                </div>
                <Button size="lg" onClick={() => navigate('/explore')}>
                  Find Language Partners
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="h-screen bg-gradient-subtle md:ml-16">
      <div className="h-full flex">
        {/* Conversations Sidebar - Desktop Only */}
        <div className="hidden lg:flex lg:w-80 border-r border-border/50 bg-card/30 flex-col flex-shrink-0">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Chats</h2>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Input placeholder="Search..." className="bg-background/50" />
          </div>
          <ChatErrorBoundary
            fallbackTitle="Conversations Error"
            fallbackMessage="Unable to load conversations list"
            onReset={() => user?.id && loadConversations(user.id)}
          >
            <div ref={conversationsPullToRefresh.containerRef} className="flex-1 overflow-y-auto relative">
              <PullToRefreshIndicator 
                pullDistance={conversationsPullToRefresh.pullDistance}
                isRefreshing={conversationsPullToRefresh.isRefreshing}
                threshold={80}
              />
              <OptimizedConversationList
                conversations={conversations}
                currentUserId={user?.id}
                activeConversationId={conversationId}
                isDesktop={true}
              />
            </div>
          </ChatErrorBoundary>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
          {/* Enhanced Header - Compact on Mobile */}
          <div className="flex-shrink-0 border-b border-border/50 p-2 md:p-4 bg-background/95 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <Link to="/chat" className="lg:hidden flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <Link 
                  to={`/profile/${otherParticipant?.user_id}`}
                  className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9 md:h-12 md:w-12 ring-2 ring-primary/20">
                      <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-cultural text-white text-sm">
                        {otherParticipant?.profiles?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {otherParticipant?.profiles?.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3.5 md:w-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {otherParticipant?.profiles?.name || 'Unknown User'}
                      </h3>
                      {otherParticipant?.profiles?.country_flag && (
                        <span className="text-base md:text-lg flex-shrink-0">{otherParticipant.profiles.country_flag}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {isTyping ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-pulse">typing</span>
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        </span>
                      ) : (
                        otherParticipant?.profiles?.online ? 'Online' : 'Offline'
                      )}
                    </p>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 md:h-9 md:w-9"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 md:h-9 md:w-9">
                      <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <Info className="mr-2 h-4 w-4" />
                      Contact Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="px-4 py-2 border-b border-border/50 bg-background/95">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="pl-9 bg-muted/50"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          )}

          {/* Messages Area */}
          <ChatErrorBoundary
            fallbackTitle="Messages Error"
            fallbackMessage="Unable to display messages"
            onReset={() => conversationId && loadMessages(conversationId)}
          >
            <div ref={messagesPullToRefresh.containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              <PullToRefreshIndicator 
                pullDistance={messagesPullToRefresh.pullDistance}
                isRefreshing={messagesPullToRefresh.isRefreshing}
                threshold={80}
              />
              {filteredMessages.map((message) => (
                <EnhancedMessageV2
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === user?.id}
                  otherUser={otherParticipant?.profiles}
                  onReply={handleReply}
                  onReact={handleReact}
                  onCopy={handleCopyMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ChatErrorBoundary>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-border/50 bg-background p-3">
            {/* Reply Preview - WhatsApp Style */}
            {replyingTo && (
              <div className="mb-2 px-3 py-2 bg-primary/5 rounded-lg border-l-4 border-primary flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary mb-1">
                    {replyingTo.sender_id === user?.id ? 'You' : otherParticipant?.profiles?.name || 'User'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    {replyingTo.type === 'image' && '📷 Photo'}
                    {replyingTo.type === 'voice' && '🎤 Voice message'}
                    {replyingTo.type === 'file' && '📎 File'}
                    {replyingTo.type === 'text' && replyingTo.content}
                  </p>
                </div>
                {replyingTo.type === 'image' && replyingTo.media_url && (
                  <img 
                    src={replyingTo.media_url} 
                    alt="" 
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-9 w-9 p-0 flex-shrink-0"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 bg-background border border-border rounded-lg shadow-lg p-3 z-50 w-64">
                    <div className="flex flex-wrap gap-2">
                      {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😎', '👏', '🙏', '💯', '✨', '🎵', '📷', '🎤', '🌟', '💪', '🚀', '🎯'].map(emoji => (
                        <button
                          key={emoji}
                          className="text-2xl hover:scale-125 transition-transform"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleAttachmentUpload}
                style={{ display: 'none' }}
              />
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // Broadcast typing indicator
                  if (conversationId && user) {
                    setIsTyping(true);
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                      setIsTyping(false);
                    }, 2000);
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-muted/50"
              />
              {newMessage.trim() ? (
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  className="h-9 w-9 p-0 flex-shrink-0 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`h-9 w-9 p-0 flex-shrink-0 ${isRecording ? 'text-red-500' : ''}`}
                  onClick={handleVoiceRecording}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording... {formatDuration(recordingDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Conversation Dialog */}
        <DeleteConversationDialog
          isOpen={deleteDialogOpen}
          conversationId={conversationId || ''}
          otherUserName={otherParticipant?.profiles?.name}
          isLoading={isDeleting}
          onConfirm={handleDeleteConversation}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default ChatPageV2;
