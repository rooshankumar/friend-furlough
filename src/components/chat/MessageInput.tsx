import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Mic, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVoiceRecording: () => void;
  isRecording: boolean;
  recordingDuration: number;
  disabled?: boolean;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  onAttachmentUpload,
  onVoiceRecording,
  isRecording,
  recordingDuration,
  disabled = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    console.log('📎 Attachment button clicked');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      console.log('📎 File input triggered');
    } else {
      console.error('❌ File input ref is null');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-auto z-50 flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md shadow-lg">
      {/* Voice Recording UI */}
      {isRecording && (
        <div className="p-2 md:p-3 border-b border-border/50 bg-destructive/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <span className="text-xs md:text-sm font-medium text-destructive">Recording...</span>
              </div>
              <div className="flex items-center space-x-1 h-6 md:h-8">
                <div className="flex items-end space-x-0.5 h-full">
                  {[...Array(15)].map((_, i) => (
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
              <span className="text-xs md:text-sm font-mono font-medium text-destructive min-w-[3rem] text-right">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Input Controls */}
      <div className="flex items-center space-x-2 p-1 md:p-3">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0"
          disabled={isRecording || disabled}
          title="Attach file"
          onClick={handleAttachmentClick}
        >
          <Image className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          style={{ display: 'none' }}
          onChange={(e) => {
            console.log('📎 File input changed, files:', e.target.files?.length);
            onAttachmentUpload(e);
          }}
        />

        <div className="flex-1">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="h-8 md:h-9 text-sm"
            autoComplete="off"
            autoCorrect="off"
            disabled={disabled}
          />
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0"
          disabled={isRecording || disabled}
          title="Voice message"
          onClick={onVoiceRecording}
        >
          <Mic className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          className="h-8 md:h-9 px-2 md:px-3 flex-shrink-0"
          disabled={!newMessage.trim() || disabled}
          onClick={onSendMessage}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
