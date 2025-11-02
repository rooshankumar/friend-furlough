import React from 'react';

interface TypingIndicatorProps {
  userNames: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userNames }) => {
  if (userNames.length === 0) return null;

  const displayText = userNames.length === 1 
    ? `${userNames[0]} is typing...`
    : `${userNames[0]} and ${userNames.length - 1} other${userNames.length > 2 ? 's' : ''} are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{displayText}</span>
    </div>
  );
};
