import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttachment: (file: File) => void;
  onVoiceRecord: () => void;
  isRecording: boolean;
  recordingDuration: number;
  isOnline: boolean;
  onTyping: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onAttachment,
  onVoiceRecord,
  isRecording,
  recordingDuration,
  isOnline,
  onTyping,
  disabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachment(file);
      e.target.value = ''; // Reset input
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2 p-3 sm:p-4 max-w-full">{/* Rest of input content */}
        {/* Attachment Button */}
        {!isRecording && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={disabled || !isOnline}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || !isOnline}
              className="shrink-0"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Input Field or Recording Indicator */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-destructive/10 rounded-full">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium text-destructive">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-sm text-muted-foreground flex-1">Recording...</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoiceRecord}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 relative">
            <Input
              ref={textInputRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                onTyping();
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isOnline ? "Type a message..." : "Offline"}
              disabled={disabled || !isOnline}
              className="pr-12 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              style={{
                fontSize: '16px', // Prevents zoom on iOS
                WebkitTextSizeAdjust: '100%'
              }}
            />
            {!isOnline && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
              </div>
            )}
          </div>
        )}

        {/* Voice/Send Button */}
        {value.trim() ? (
          <Button
            onClick={onSend}
            disabled={disabled || !isOnline}
            size="icon"
            className="shrink-0 rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={onVoiceRecord}
            disabled={disabled || !isOnline}
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className="shrink-0 rounded-full"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
