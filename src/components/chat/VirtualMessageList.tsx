import React, { useEffect, memo } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { EnhancedMessage } from './EnhancedMessage';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  type?: string;
  media_url?: string;
  client_id?: string;
  status?: 'sending' | 'sent' | 'failed';
}

interface VirtualMessageListProps {
  messages: Message[];
  currentUserId: string;
  containerHeight: number;
  onLoadMore?: () => void;
}

const MESSAGE_HEIGHT = 80; // Average message height in pixels

export const VirtualMessageList = memo<VirtualMessageListProps>(({
  messages,
  currentUserId,
  containerHeight,
  onLoadMore
}) => {
  const {
    containerRef,
    visibleItems,
    visibleStart,
    totalHeight,
    scrollToBottom,
    offsetY
  } = useVirtualScroll({
    itemHeight: MESSAGE_HEIGHT,
    containerHeight,
    items: messages,
    overscan: 5 // Render 5 extra items above and below viewport
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messages.length, scrollToBottom]);

  // Load more when scrolling near top
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;

    const handleScroll = () => {
      if (container.scrollTop < 200) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, containerRef]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((message, index) => (
            <div key={message.id} style={{ height: MESSAGE_HEIGHT }}>
              <EnhancedMessage
                message={message}
                isOwnMessage={message.sender_id === currentUserId}
                showAvatar={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualMessageList.displayName = 'VirtualMessageList';
