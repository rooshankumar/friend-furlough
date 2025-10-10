import React from 'react';
import { Clock, Check, CheckCheck, X } from 'lucide-react';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: MessageStatus;
  timestamp: string;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  timestamp, 
  className = "" 
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div title="Sending...">
            <Clock className="h-3.5 w-3.5 text-gray-400 animate-pulse" />
          </div>
        );
      case 'sent':
      case 'delivered':
        return (
          <div title="Delivered">
            <Check className="h-3.5 w-3.5 text-gray-700" />
          </div>
        );
      case 'read':
        return (
          <div title="Read">
            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
          </div>
        );
      case 'failed':
        return (
          <div title="Failed to send. Tap to retry">
            <X className="h-3.5 w-3.5 text-red-500 cursor-pointer hover:text-red-600" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <span className="text-gray-500">
        {formatTime(timestamp)}
      </span>
      {getStatusIcon()}
    </div>
  );
};

export default MessageStatus;
