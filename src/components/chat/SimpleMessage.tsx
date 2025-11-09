import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface SimpleMessageProps {
  message: any & { status?: MessageStatus; uploadProgress?: number };
  isCurrentUser: boolean;
  showDateSeparator: boolean;
  isLastMessage: boolean;
  isLastUserMessage: boolean;
  messageReadStatus: boolean;
}

// Ultra-simple message component for performance
export const SimpleMessage: React.FC<SimpleMessageProps> = ({
  message,
  isCurrentUser,
  showDateSeparator,
  isLastMessage,
  isLastUserMessage,
  messageReadStatus
}) => {
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
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[75%] sm:max-w-[60%] ${
          message.media_url && (message.type === 'image' || message.type === 'voice')
            ? '' 
            : `${isCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent text-accent-foreground'
              } rounded-2xl px-3 py-2`
        }`}>
          
          {/* Media content */}
          {message.media_url && (
            <div>
              {message.type === 'image' ? (
                <div className="relative rounded-2xl overflow-hidden bg-muted/10">
                  <img 
                    src={message.media_url} 
                    alt="Attachment" 
                    className="w-full h-auto cursor-pointer max-h-[280px] md:max-h-64 object-contain active:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(message.media_url, '_blank');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(message.media_url, '_blank');
                    }}
                    loading="lazy"
                    style={{ maxWidth: '240px' }}
                  />
                </div>
              ) : message.type === 'voice' ? (
                <div className="flex items-center gap-2 max-w-xs">
                  <div className="w-6 h-6 flex items-center justify-center">🎤</div>
                  <audio 
                    controls 
                    className="flex-1" 
                    preload="metadata" 
                    src={message.media_url}
                    controlsList="nodownload"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 p-3 bg-background/10 rounded-lg cursor-pointer hover:bg-background/20 active:bg-background/30 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(message.media_url, '_blank');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(message.media_url, '_blank');
                  }}
                >
                  <div className="w-10 h-10 bg-background/20 rounded-lg flex items-center justify-center">📎</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.content}</p>
                    <p className="text-xs opacity-70">Tap to open</p>
                  </div>
                  <div className="text-xs opacity-50">⬇️</div>
                </div>
              )}
            </div>
          )}
          
          {/* Text content */}
          {!message.media_url && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>

        {/* Status indicators */}
        {((isCurrentUser && isLastUserMessage) || (!isCurrentUser && isLastMessage)) && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs opacity-70 text-muted-foreground">
              {new Date(message.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {isCurrentUser && (
              <>
                {message.status === 'sending' && (
                  <Clock className="h-3 w-3 opacity-50 text-muted-foreground animate-pulse" />
                )}
                {message.status === 'sent' && (
                  <Check className="h-3 w-3 opacity-70 text-muted-foreground" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="h-3 w-3 opacity-70 text-muted-foreground" />
                )}
                {message.status === 'read' || (message.status === undefined && messageReadStatus) ? (
                  <CheckCheck className="h-3 w-3 text-green-500" />
                ) : null}
                {message.status === 'failed' && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
              </>
            )}
          </div>
        )}
        
        {/* Upload progress */}
        {message.uploadProgress !== undefined && message.uploadProgress < 100 && (
          <div className="w-full max-w-[75%] sm:max-w-[60%] mt-1">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${message.uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-1">{message.uploadProgress}%</span>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
