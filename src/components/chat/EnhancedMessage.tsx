import React from 'react';
import { MessageStatus } from './MessageStatus';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  type: string;
  media_url?: string;
  status?: MessageStatusType;
  tempId?: string;
}

interface EnhancedMessageProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  otherUser?: {
    name: string;
    avatar_url?: string;
  };
  onRetry?: (message: Message) => void;
}

export const EnhancedMessage: React.FC<EnhancedMessageProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  otherUser,
  onRetry
}) => {
  const handleRetryClick = () => {
    if (message.status === 'failed' && onRetry) {
      onRetry(message);
    }
  };

  const renderMessageContent = () => {
    // For attachments, we'll render them in attachment bubbles
    if (message.type === 'image' && message.media_url) {
      // Check if content is just a filename (contains .png, .jpg, .jpeg, .gif, .webp, etc.)
      const isFilename = message.content && /\.(png|jpg|jpeg|gif|webp|bmp|svg|tiff|ico|heic|heif)$/i.test(message.content.trim());
      
      return (
        <div className="relative group rounded-2xl overflow-hidden bg-muted/10" style={{ maxWidth: '240px' }}>
          <img 
            src={message.media_url} 
            alt="Shared image" 
            className="w-full h-auto max-h-[280px] md:max-h-64 object-contain cursor-pointer active:opacity-80 transition-opacity"
            loading="lazy"
            onClick={() => window.open(message.media_url, '_blank')}
          />
          
          {/* 3-dot menu overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={() => window.open(message.media_url, '_blank')}
                  className="cursor-pointer"
                >
                  <span className="mr-2">👁️</span>
                  View Full Size
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = message.media_url;
                    link.download = `image_${Date.now()}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-2">📥</span>
                  Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Only show caption if there's actual text content (not a filename) */}
          {message.content && 
           message.content !== 'Attachment' && 
           message.content.trim() && 
           !isFilename && (
            <p className="mt-2 text-sm opacity-90">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.type === 'voice' && message.media_url) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          {/* Voice icon */}
          <div className="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🎤</span>
          </div>
          {/* Compact audio player */}
          <audio controls className="h-6" style={{ width: '120px' }}>
            <source src={message.media_url} type="audio/webm" />
            <source src={message.media_url} type="audio/wav" />
          </audio>
        </div>
      );
    }

    if (message.type === 'file' && message.media_url) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          {/* File icon */}
          <div className="w-8 h-8 rounded-lg bg-current/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📎</span>
          </div>
          {/* Simple download link - no filename shown */}
          <a 
            href={message.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs hover:underline opacity-80"
          >
            📥 File
          </a>
        </div>
      );
    }

    // Regular text message
    return (
      <p className="text-[13px] leading-snug whitespace-pre-wrap pr-12">
        {message.content}
      </p>
    );
  };

  // Check if this is an attachment (image, voice, or file)
  const isAttachment = message.type !== 'text' && message.media_url;

  return (
    <div className={`flex gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {isAttachment ? (
          // Attachment without bubble - just the content
          <div className="relative">
            {renderMessageContent()}
          </div>
        ) : (
          // Text message with bubble, time, and ticks
          <div
            className={`relative rounded-xl ${
              isOwnMessage ? 'rounded-br-sm' : 'rounded-bl-sm'
            }`}
            style={{ 
              cursor: message.status === 'failed' ? 'pointer' : 'default',
              // Clean modern colors
              backgroundColor: isOwnMessage
                ? message.status === 'failed' 
                  ? '#DC2626' // Red for failed messages
                  : '#00FF00' // Bright green for sent messages
                : '#FFFFFF', // Pure white for received messages
              color: isOwnMessage
                ? '#FFFFFF' // White text on green
                : '#1F2937', // Dark gray text on white
              border: 'none',
              boxShadow: isOwnMessage ? 'none' : '0 0.5px 1px rgba(0, 0, 0, 0.03)',
              // Dark mode overrides - only apply in dark mode
              ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches && {
                backgroundColor: isOwnMessage
                  ? message.status === 'failed' 
                    ? '#DC2626'
                    : '#00CC00' // Slightly darker bright green for dark mode
                  : '#374151', // Dark gray for received in DARK mode only
                color: isOwnMessage
                  ? '#FFFFFF' // White text
                  : '#F3F4F6', // Light gray text in DARK mode only
                border: 'none',
              })
            }}
            onClick={message.status === 'failed' ? handleRetryClick : undefined}
          >
            {/* Message content */}
            <div className="px-2 py-1 relative">
              {renderMessageContent()}
              
              {/* Compact Time and Status - Bottom Right Corner */}
              <div 
                className="absolute bottom-0.5 right-1.5 flex items-center gap-0.5"
                style={{
                  color: isOwnMessage 
                    ? 'rgba(255, 255, 255, 0.9)' // White with high opacity for sent messages
                    : 'rgba(31, 41, 55, 0.7)', // Dark gray for received messages in light mode
                  // Dark mode overrides
                  ...(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches && {
                    color: isOwnMessage 
                      ? 'rgba(255, 255, 255, 0.95)' // Very high opacity for dark mode sent
                      : 'rgba(255, 255, 255, 0.8)' // White text for received in dark mode
                  })
                }}
              >
                {/* Ultra Compact Time */}
                <span className="text-[8px] font-normal leading-none">
                  {new Date(message.created_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </span>
                
                {/* Compact Status Ticks for Sent Messages */}
                {isOwnMessage && (
                  <div className="flex items-center">
                    {message.status === 'sending' && (
                      <div title="Sending..." className="animate-pulse ml-0.5">
                        <div className="w-1 h-1 rounded-full bg-current opacity-70" />
                      </div>
                    )}
                    {(message.status === 'sent' || message.status === 'delivered') && (
                      <div title="Delivered" className="transition-all duration-200 ml-0.5">
                        {/* Single tick - Gray for delivered */}
                        <svg className="w-2 h-2 opacity-70" viewBox="0 0 24 24" style={{ fill: 'currentColor' }}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </div>
                    )}
                    {message.status === 'read' && (
                      <div title="Read" className="transition-all duration-300 animate-in fade-in ml-0.5">
                        {/* Double tick - Blue for read (from logo) */}
                        <svg 
                          className="w-2 h-2" 
                          viewBox="0 0 24 24" 
                          style={{ 
                            fill: '#1E40AF' // Blue from RoshLingua logo
                          }}
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          <path d="M19.59 7L12 14.59 6.41 9 5 10.41l7 7 9-9L19.59 7z"/>
                        </svg>
                      </div>
                    )}
                    {message.status === 'failed' && (
                      <div title="Failed to send. Tap to retry" className="ml-0.5">
                        <svg className="w-2 h-2 opacity-80" viewBox="0 0 16 16" style={{ fill: '#EF4444' }}>
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Retry hint for failed messages (text only) */}
        {message.status === 'failed' && !isAttachment && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-red-500">
              Tap to retry
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessage;
