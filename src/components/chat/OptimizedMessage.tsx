import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CompactUploadProgress } from '@/components/CompactUploadProgress';

interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: string;
  language?: string;
  translation?: string;
  media_url?: string;
  uploadProgress?: number;
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

interface OptimizedMessageProps {
  message: DbMessage;
  isCurrentUser: boolean;
  showDateSeparator: boolean;
  isLastMessage: boolean;
  isLastUserMessage: boolean;
  messageReadStatus: boolean;
}

// Memoized Audio Component
const AudioMessage = React.memo(({ src }: { src: string }) => (
  <div className="flex items-center gap-2 max-w-xs">
    <div className="w-6 h-6 flex items-center justify-center">
      🎤
    </div>
    <audio 
      controls 
      className="flex-1"
      preload="metadata"
      src={src}
      onError={(e) => {
        console.error('Audio playback error:', e);
      }}
      onLoadedMetadata={(e) => {
        const audio = e.currentTarget;
        console.log('Audio loaded - duration:', audio.duration, 'seconds');
      }}
    >
      Your browser does not support the audio element.
    </audio>
  </div>
));

// Memoized Image Component with Upload Progress
const ImageMessage = React.memo(({ 
  src, 
  alt, 
  uploadProgress, 
  isUploading 
}: { 
  src?: string; 
  alt: string;
  uploadProgress?: number;
  isUploading?: boolean;
}) => (
  <div className="relative rounded-2xl overflow-hidden bg-muted/10">
    {src ? (
      <img 
        src={src} 
        alt={alt}
        className="w-full h-auto cursor-pointer max-h-[280px] md:max-h-64 object-contain active:opacity-80 transition-opacity"
        onClick={() => window.open(src, '_blank')}
        onError={(e) => {
          console.error('Image failed to load:', src);
          e.currentTarget.style.display = 'none';
        }}
        loading="lazy"
        style={{ maxWidth: '240px' }}
      />
    ) : (
      // Placeholder while uploading
      <div className="w-48 h-48 bg-muted/20 rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )}
    
    {/* Upload Progress Overlay */}
    {isUploading && uploadProgress !== undefined && uploadProgress < 100 && (
      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
        <CompactUploadProgress progress={uploadProgress} size={48} strokeWidth={4} />
      </div>
    )}
  </div>
));

// Memoized File Attachment Component
const FileMessage = React.memo(({ src, content }: { src: string; content: string }) => (
  <div className="flex items-center gap-2 p-3 bg-background/10 rounded-lg cursor-pointer hover:bg-background/20 transition-colors"
       onClick={() => window.open(src, '_blank')}>
    <div className="w-10 h-10 bg-background/20 rounded-lg flex items-center justify-center">
      📎
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{content}</p>
      <p className="text-xs opacity-70">Click to download</p>
    </div>
    <div className="text-xs opacity-50">⬇️</div>
  </div>
));

// Memoized Date Separator
const DateSeparator = React.memo(({ date }: { date: string }) => (
  <div className="flex justify-center my-4">
    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
      {new Date(date).toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })}
    </span>
  </div>
));

// Memoized Status Indicators
const MessageStatus = React.memo(({ 
  createdAt, 
  isRead, 
  isCurrentUser 
}: { 
  createdAt: string; 
  isRead: boolean; 
  isCurrentUser: boolean; 
}) => (
  <div className="flex items-center gap-1 mt-1">
    <span className="text-xs opacity-70 text-muted-foreground">
      {new Date(createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
    </span>
    {isCurrentUser && (
      isRead ? (
        <CheckCheck className="h-3 w-3 text-green-500" />
      ) : (
        <Check className="h-3 w-3 opacity-70 text-muted-foreground" />
      )
    )}
  </div>
));

// Main Optimized Message Component
export const OptimizedMessage = React.memo<OptimizedMessageProps>(({
  message,
  isCurrentUser,
  showDateSeparator,
  isLastMessage,
  isLastUserMessage,
  messageReadStatus
}) => {
  // Determine if message is currently uploading
  const isUploading = message.status === 'sending' && message.uploadProgress !== undefined;

  // Memoize media content rendering
  const mediaContent = React.useMemo(() => {
    if (message.type === 'image') {
      return (
        <ImageMessage 
          src={message.media_url} 
          alt="Attachment"
          uploadProgress={message.uploadProgress}
          isUploading={isUploading}
        />
      );
    } else if (message.type === 'voice' && message.media_url) {
      return <AudioMessage src={message.media_url} />;
    } else if (message.media_url) {
      return <FileMessage src={message.media_url} content={message.content} />;
    }
    return null;
  }, [message.media_url, message.type, message.content, message.uploadProgress, isUploading]);

  // Memoize message styling
  const messageStyle = React.useMemo(() => {
    if (message.media_url && (message.type === 'image' || message.type === 'voice')) {
      return '';
    }
    return `${isCurrentUser 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-accent text-accent-foreground'
    } rounded-2xl px-3 py-2`;
  }, [message.media_url, message.type, isCurrentUser]);

  return (
    <React.Fragment key={message.id}>
      {showDateSeparator && <DateSeparator date={message.created_at} />}
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Message content */}
        <div className={`max-w-[75%] sm:max-w-[60%] ${messageStyle}`}>
          {mediaContent}
          
          {/* Text content - hide for attachments */}
          {!message.media_url && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>

        {/* Status indicators */}
        {((isCurrentUser && isLastUserMessage) || (!isCurrentUser && isLastMessage)) && (
          <MessageStatus 
            createdAt={message.created_at}
            isRead={messageReadStatus}
            isCurrentUser={isCurrentUser}
          />
        )}
      </div>
    </React.Fragment>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.isCurrentUser === nextProps.isCurrentUser &&
    prevProps.showDateSeparator === nextProps.showDateSeparator &&
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.isLastUserMessage === nextProps.isLastUserMessage &&
    prevProps.messageReadStatus === nextProps.messageReadStatus
  );
});

OptimizedMessage.displayName = 'OptimizedMessage';
