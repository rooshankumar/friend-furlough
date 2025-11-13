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

import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { isMobileApp } from '@/lib/mobileFilePicker';
import MobileFileInput from '@/components/MobileFileInput';
import { MobileFileUploadOptimized } from '@/components/MobileFileUploadOptimized';
import { B2Image } from '@/components/B2Image';
import { ImageViewer } from '@/components/chat/ImageViewer';
import { ImageGrid } from '@/components/chat/ImageGrid';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useMessageDeduplication } from '@/hooks/useMessageDeduplication';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useBatchPresence } from '@/hooks/useBatchPresence';
import { usePresence, getOnlineStatus } from '@/hooks/usePresence';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { OptimizedConversationList } from '@/components/chat/OptimizedConversationList';
import { ChatErrorBoundary } from '@/components/ErrorBoundary';
import { VoiceMessagePlayer } from '@/components/chat/VoiceMessagePlayer';
import { DeleteConversationDialog } from '@/components/chat/DeleteConversationDialog';
import { CompactUploadProgress } from '@/components/CompactUploadProgress';
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
import { formatLastSeen, isUserOnline } from '@/lib/timeUtils';
import { logger } from '@/lib/logger';
import { mobileOptimizer, isMobile, optimizeScrolling } from '@/lib/mobileOptimization';
import { simpleAPKOptimizer } from '@/lib/apkOptimizationsSimple';
import { Capacitor } from '@capacitor/core';

// Enhanced Message Component with Reactions
interface EnhancedMessageV2Props {
  message: any;
  isOwnMessage: boolean;
  otherUser?: any;
  isLastMessage?: boolean;
  onRetry?: (message: any) => void;
  onRemove?: (message: any) => void;
  onReact?: (messageId: string, reaction: string) => void;
  onReply?: (message: any) => void;
  onCopy?: (content: string) => void;
  onDelete?: (messageId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const EnhancedMessageV2: React.FC<EnhancedMessageV2Props> = ({
  message,
  isOwnMessage,
  otherUser,
  isLastMessage = false,
  onRetry,
  onRemove,
  onReact,
  onReply,
  onCopy,
  onDelete,
  onImageClick
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

      <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] relative`}>
        {/* Image Message */}
        {message.type === 'image' ? (
          <>
            <div className="relative group">
              {message.media_url ? (
                <div 
                  onClick={() => onImageClick?.(message.media_url!)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <B2Image 
                    src={message.media_url} 
                    alt="Shared image"
                    loading="lazy"
                    className="max-w-[200px] max-h-[160px] object-cover rounded-xl"
                  />
                </div>
              ) : (
                // Placeholder while uploading
                <div className="w-48 h-32 bg-muted/20 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Upload Progress Overlay */}
              {message.status === 'sending' && message.uploadProgress !== undefined && message.uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CompactUploadProgress progress={message.uploadProgress} size={48} strokeWidth={4} />
                </div>
              )}

              {/* Failed Upload Overlay with Retry and Remove */}
              {message.status === 'failed' && (
                <div className="absolute inset-0 bg-red-500/40 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm gap-2 p-3 text-center">
                  <div className="text-white text-sm font-semibold">Upload Failed</div>
                  <div className="text-white/90 text-xs">This failed upload will disappear in 30s</div>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => onRetry?.(message)}
                    >
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      onClick={() => onRemove?.(message)}
                    >
                      Remove now
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* Timestamp for image */}
            <span className="text-[10px] text-muted-foreground mt-1">
              {new Date(message.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </span>
          </>
        ) : message.type === 'voice' && message.media_url ? (
          <>
            {/* Voice Message - Modern Waveform */}
            <VoiceMessagePlayer 
              audioUrl={message.media_url}
              isOwnMessage={isOwnMessage}
            />
            {/* Timestamp for voice */}
            <span className="text-[10px] text-muted-foreground mt-1">
              {new Date(message.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </span>
          </>
        ) : (
          /* Text Message Bubble */
          <div
            className={`relative rounded-2xl px-2.5 py-1 ${
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
                  <B2Image 
                    src={message.reply_to.media_url} 
                    alt="" 
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                )}
              </div>
            )}

            {/* Message Content */}
            <p className="text-[15px] leading-relaxed pr-16 whitespace-pre-wrap">
              {message.content}
            </p>

            {/* Time only */}
            <div 
              className="absolute bottom-1 right-2 flex items-center gap-1.5"
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
            </div>
          </div>
        )}
        
        {/* Show "Seen" with avatar below the last message if read (own messages only) */}
        {isOwnMessage && isLastMessage && message.status === 'read' && (
          <div className="flex justify-end mt-1">
            <div className="flex items-center gap-1">
              <Avatar className="h-3.5 w-3.5">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback className="bg-gradient-cultural text-white text-[8px]">
                  {otherUser?.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground">Seen</span>
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  // Pull-to-refresh for messages
  const messagesPullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      if (conversationId) {
        await loadMessages(conversationId);
        // Removed toast notification for minimal UI
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
        // Removed toast notification for minimal UI
      }
    },
    threshold: 80
  });
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, forceUpdate] = useState({});

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
    removeTempMessage,
    broadcastTyping,
    typingUsers,
  } = useChatStore();

  const currentConversation = useMemo(() => 
    conversationId ? conversations.find(c => c.id === conversationId) : null,
    [conversationId, conversations]
  );

  const conversationMessages = useMemo(() => 
    conversationId ? messages[conversationId] || [] : [],
    [conversationId, messages]
  );

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (conversationMessages.length > 0) {
      scrollToBottom();
    }
  }, [conversationMessages.length, scrollToBottom]);

  // Auto-scroll when conversation changes
  useEffect(() => {
    if (conversationId && conversationMessages.length > 0) {
      // Scroll immediately when switching conversations
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [conversationId, scrollToBottom]);

  // Get other participant from current conversation
  const otherParticipant = useMemo(() => 
    currentConversation?.participants?.find(p => p.user_id !== user?.id),
    [currentConversation, user?.id]
  );

  // Track presence for current chat partner
  const { presence: currentUserPresence } = usePresence(otherParticipant?.user_id);
  const { isOnline: isCurrentUserOnline } = getOnlineStatus(currentUserPresence);

  // Track presence for all conversation participants
  const conversationUserIds = useMemo(() => 
    conversations.flatMap(c => c.participants?.map(p => p.user_id) || []).filter(id => id !== user?.id),
    [conversations, user?.id]
  );
  const { isUserOnline } = useBatchPresence(conversationUserIds);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return conversationMessages;
    const query = searchQuery.toLowerCase();
    return conversationMessages.filter(msg => 
      msg.content?.toLowerCase().includes(query)
    );
  }, [conversationMessages, searchQuery]);

  // Group consecutive image messages from the same sender
  const groupedMessages = useMemo(() => {
    const grouped: any[] = [];
    let currentImageGroup: any[] = [];
    let currentSender: string | null = null;

    filteredMessages.forEach((message, index) => {
      // Check if this is an image message from the same sender
      if (message.type === 'image' && message.sender_id === currentSender) {
        currentImageGroup.push(message);
      } else {
        // Push previous image group if it exists
        if (currentImageGroup.length > 0) {
          grouped.push({
            type: 'image_group',
            messages: currentImageGroup,
            sender_id: currentSender,
            created_at: currentImageGroup[0].created_at,
            id: `group_${currentImageGroup[0].id}`
          });
          currentImageGroup = [];
        }

        // Start new group or add regular message
        if (message.type === 'image') {
          currentImageGroup = [message];
          currentSender = message.sender_id;
        } else {
          grouped.push(message);
          currentSender = null;
        }
      }
    });

    // Don't forget the last group
    if (currentImageGroup.length > 0) {
      grouped.push({
        type: 'image_group',
        messages: currentImageGroup,
        sender_id: currentSender,
        created_at: currentImageGroup[0].created_at,
        id: `group_${currentImageGroup[0].id}`
      });
    }

    return grouped;
  }, [filteredMessages]);

  // Load conversations and messages
  useEffect(() => {
    if (user?.id && conversations.length === 0) {
      loadConversations(user.id);
    }
  }, [user?.id, conversations.length, loadConversations]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Check if current conversation exists in our local state
    const conversationExists = conversations.some(conv => conv.id === conversationId);
    
    // Only reload if conversation doesn't exist AND we have other conversations loaded
    // This prevents infinite loops
    if (!conversationExists && conversations.length > 0) {
      console.log('🔄 Conversation not found locally, reloading conversations...');
      loadConversations(user.id);
    }
  }, [conversationId, user?.id]); // Removed conversations from dependencies to prevent infinite loop

  // Load messages when conversation becomes available
  useEffect(() => {
    if (!conversationId || !user) return;
    
    const conversationExists = conversations.some(conv => conv.id === conversationId);
    if (conversationExists) {
      console.log('✅ Conversation found, loading messages...');
      loadMessages(conversationId);
      markAsRead(conversationId, user.id);
      const channel = subscribeToMessages(conversationId);
      
      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [conversations.length, conversationId, user?.id]); // Trigger when conversations are loaded

  // Note: Online status is now tracked via usePresence hook above

  // Mark messages as read when viewing them
  useEffect(() => {
    if (!conversationId || !user || conversationMessages.length === 0) return;

    const markMessagesAsRead = async () => {
      // Get all messages from other users that need to be marked as read
      const messagesToMark = conversationMessages.filter(
        msg => msg.sender_id !== user.id && msg.status !== 'read'
      );

      if (messagesToMark.length === 0) return;

      logger.debug(`Marking ${messagesToMark.length} messages as read`);

      // Mark each message as read using upsert to avoid conflicts
      let markedCount = 0;
      for (const message of messagesToMark) {
        try {
          const { error } = await supabase
            .from('message_reads')
            .upsert({
              message_id: message.id,
              user_id: user.id,
              read_at: new Date().toISOString()
            }, {
              onConflict: 'message_id,user_id',
              ignoreDuplicates: true
            });
          
          if (!error) {
            markedCount++;
          } else {
            logger.error('Error marking message as read', error);
          }
        } catch (error: any) {
          logger.error('Error marking message as read', error);
        }
      }

      if (markedCount > 0) {
        logger.debug(`Marked ${markedCount} messages as read`);
        // Reload messages to get updated status
        setTimeout(() => {
          loadMessages(conversationId);
        }, 300);
      }
    };

    // Delay marking as read to ensure user actually sees the messages
    const timer = setTimeout(markMessagesAsRead, 500);
    return () => clearTimeout(timer);
  }, [conversationId, user, conversationMessages, loadMessages]);

  // Mobile optimization effects
  useEffect(() => {
    if (!isMobile()) return;

    logger.mobile('Initializing mobile optimizations for ChatPageV2');
    
    // Initialize APK optimizations if running in APK
    if (Capacitor.isNativePlatform()) {
      simpleAPKOptimizer.initialize();
      simpleAPKOptimizer.testOptimizations();
    }
    
    // Optimize file upload for mobile
    mobileOptimizer.optimizeForFileUpload();
    
    // Add mobile gestures to messages container
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      mobileOptimizer.addMobileGestures(messagesContainer as HTMLElement);
      optimizeScrolling(messagesContainer as HTMLElement);
    }

    // Optimize viewport for mobile chat
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
      );
    }

    // Performance monitoring for mobile
    const startTime = performance.now();
    logger.performance('ChatPageV2 mobile init', startTime);

    return () => {
      logger.mobile('Cleaning up mobile optimizations');
    };
  }, []);

  // Optimize scrolling performance on mobile
  useEffect(() => {
    if (!isMobile()) return;

    const messagesContainer = messagesPullToRefresh.containerRef.current;
    if (messagesContainer) {
      // Add will-change for better scroll performance
      messagesContainer.style.willChange = 'scroll-position';
      
      // Optimize touch scrolling
      messagesContainer.style.touchAction = 'pan-y';
      
      return () => {
        messagesContainer.style.willChange = 'auto';
      };
    }
  }, [messagesPullToRefresh.containerRef]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    if (!isMobile()) return;

    const handleResize = () => {
      // Scroll to bottom when keyboard appears/disappears
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);

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
      // Auto-scroll to bottom after sending message
      setTimeout(() => scrollToBottom(), 100);
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
  }, [newMessage, conversationId, user, replyingTo, sendMessage, toast, generateClientId, isDuplicate, markAsSent, clearMessage, scrollToBottom]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

  const handleReact = (messageId: string, reaction: string) => {
    // TODO: Implement reaction storage
    logger.debug('Message reaction', { messageId, reaction });
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

  const handleRetryUpload = async (message: any) => {
    if (!conversationId || !message.tempId) return;
    toast({
      title: "Retry Upload",
      description: "Please select the file again to retry upload",
    });
  };

  const handleRemoveFailedUpload = (message: any) => {
    if (!conversationId || !message?.tempId) return;
    removeTempMessage(conversationId, message.tempId);
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!file || !conversationId || !user) {
      toast({
        title: "Upload failed",
        description: "Invalid upload request.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive"
      });
      return;
    }

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Attachments require an internet connection.",
        variant: "destructive"
      });
      return;
    }

    logger.mobile('Starting attachment upload', { fileName: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB` });
    setIsUploadingAttachment(true);

    try {
      await sendAttachment(conversationId, user.id, file);
      
      toast({
        title: "Sent!",
        description: "Attachment uploaded successfully",
      });
    } catch (error: any) {
      logger.error('Attachment upload failed', error);
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload attachment.',
        variant: "destructive"
      });
    } finally {
      setIsUploadingAttachment(false);
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
      logger.error('Failed to delete conversation', error);
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
                isUserOnline={isUserOnline}
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
                isUserOnline={isUserOnline}
              />
            </div>
          </ChatErrorBoundary>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
          {/* Enhanced Header - Compact on Mobile - FIXED POSITION */}
          <div className="flex-shrink-0 border-b border-border/50 p-2 md:p-4 bg-background/95 backdrop-blur-md shadow-sm sticky top-0 z-10">
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
                    {isCurrentUserOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3.5 md:w-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
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
                      {conversationId && typingUsers[conversationId] && user && 
                       Object.keys(typingUsers[conversationId]).some(userId => userId !== user.id) ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-pulse">typing</span>
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        </span>
                      ) : isCurrentUserOnline ? (
                        <span className="text-green-500 font-medium">online</span>
                      ) : currentUserPresence?.last_seen ? (
                        formatLastSeen(currentUserPresence.last_seen)
                      ) : (
                        'offline'
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
            <div ref={messagesPullToRefresh.containerRef} className="messages-container flex-1 overflow-y-auto p-4 space-y-3 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
              <PullToRefreshIndicator 
                pullDistance={messagesPullToRefresh.pullDistance}
                isRefreshing={messagesPullToRefresh.isRefreshing}
                threshold={80}
              />
              {(() => {
                // Find the index of the last message from current user
                let lastOwnMessageIndex = -1;
                for (let i = groupedMessages.length - 1; i >= 0; i--) {
                  if (groupedMessages[i].sender_id === user?.id) {
                    lastOwnMessageIndex = i;
                    break;
                  }
                }
                
                // Check if the very last message in the conversation is from current user
                const lastMessageInConversation = groupedMessages[groupedMessages.length - 1];
                const isLastMessageFromCurrentUser = lastMessageInConversation?.sender_id === user?.id;
                
                return groupedMessages.map((item, index) => {
                  const isOwnMessage = item.sender_id === user?.id;
                  const isLastOwnMessage = isOwnMessage && index === lastOwnMessageIndex && isLastMessageFromCurrentUser;
                  
                  // Handle image groups
                  if (item.type === 'image_group') {
                    return (
                      <div key={item.id} className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar for received messages */}
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8 mt-auto">
                            <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                            <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                              {otherParticipant?.profiles?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          <ImageGrid 
                            images={item.messages}
                            onImageClick={setViewingImage}
                            onRetry={handleRetryUpload}
                            onRemove={handleRemoveFailedUpload}
                            isOwnMessage={isOwnMessage}
                          />
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            })}
                          </span>
                          {isLastOwnMessage && item.messages[item.messages.length - 1]?.status === 'read' && (
                            <div className="flex items-center gap-1 mt-1">
                              <Avatar className="h-3.5 w-3.5">
                                <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                                <AvatarFallback className="bg-gradient-cultural text-white text-[8px]">
                                  {otherParticipant?.profiles?.name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground">Seen</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle regular messages
                  return (
                    <EnhancedMessageV2
                      key={item.id}
                      message={item}
                      isOwnMessage={isOwnMessage}
                      isLastMessage={isLastOwnMessage}
                      otherUser={otherParticipant?.profiles}
                      onReply={handleReply}
                      onReact={handleReact}
                      onCopy={handleCopyMessage}
                      onDelete={handleDeleteMessage}
                      onRetry={handleRetryUpload}
                      onRemove={handleRemoveFailedUpload}
                      onImageClick={setViewingImage}
                    />
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>
          </ChatErrorBoundary>

          {/* Typing Indicator - Only show OTHER users typing */}
          {conversationId && typingUsers[conversationId] && user && (() => {
            const otherUsersTyping = Object.entries(typingUsers[conversationId])
              .filter(([userId]) => userId !== user.id)
              .map(([_, userName]) => userName);
            
            if (otherUsersTyping.length === 0) return null;
            
            return (
              <div className="px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {otherUsersTyping.length === 1 
                    ? `${otherUsersTyping[0]} is typing...`
                    : `${otherUsersTyping[0]} and ${otherUsersTyping.length - 1} other${otherUsersTyping.length > 2 ? 's' : ''} are typing...`
                  }
                </span>
              </div>
            );
          })()}

          {/* Message Input - Enhanced Mobile - FIXED POSITION */}
          <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md p-2 md:p-4 safe-bottom sticky bottom-0 z-10">
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
                  <B2Image 
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
              {/* ✅ OPTIMIZED: Mobile-first file upload */}
              <MobileFileUploadOptimized
                onFileSelect={handleAttachmentUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="flex-shrink-0"
                disabled={!isOnline}
                isLoading={isUploadingAttachment}
                maxSizeMB={20}
              />
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // Broadcast typing indicator to other participants
                  if (conversationId && user && profile) {
                    broadcastTyping(conversationId, user.id, profile.name || 'User', true);
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                      broadcastTyping(conversationId, user.id, profile.name || 'User', false);
                    }, 2000);
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-muted/50"
                style={{ fontSize: '16px' }}
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
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

        {/* Image Viewer */}
        {viewingImage && (
          <ImageViewer
            imageUrl={viewingImage}
            onClose={() => setViewingImage(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPageV2;