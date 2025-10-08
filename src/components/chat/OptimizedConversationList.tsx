import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useVirtualScroll } from '@/hooks/usePerformanceOptimization';

interface ConversationItem {
  id: string;
  participants: any[];
  lastMessage?: any;
  unreadCount: number;
}

interface ConversationItemProps {
  conversation: ConversationItem;
  currentUserId?: string;
  isActive?: boolean;
  isDesktop?: boolean;
}

// Memoized individual conversation item
const ConversationItem = React.memo<ConversationItemProps>(({
  conversation,
  currentUserId,
  isActive = false,
  isDesktop = false
}) => {
  const otherUser = React.useMemo(() => 
    conversation.participants.find(p => p.user_id !== currentUserId),
    [conversation.participants, currentUserId]
  );
  
  const participantProfile = otherUser?.profiles;
  
  const timeAgo = React.useMemo(() => {
    if (!conversation.lastMessage) return '';
    return formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })
      .replace('about ', '')
      .replace(' ago', '');
  }, [conversation.lastMessage]);

  const avatarSize = isDesktop ? 'h-10 w-10' : 'h-12 w-12';
  const textSize = isDesktop ? 'text-sm' : 'text-base';
  const timeSize = isDesktop ? 'text-[10px]' : 'text-xs';
  const contentSize = isDesktop ? 'text-xs' : 'text-sm';

  return (
    <Link to={`/chat/${conversation.id}`}>
      <div className={`p-${isDesktop ? '3' : '4'} hover:bg-accent/50 cursor-pointer border-b border-border/50 ${
        isActive ? 'bg-accent/50' : ''
      }`}>
        <div className={`flex items-start space-x-${isDesktop ? '2' : '3'}`}>
          <div className="relative">
            <Avatar className={avatarSize}>
              <AvatarImage src={participantProfile?.avatar_url} />
              <AvatarFallback className="bg-gradient-cultural text-white">
                {participantProfile?.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            {participantProfile?.online && (
              <span className={`absolute bottom-0 right-0 ${isDesktop ? 'h-2.5 w-2.5' : 'h-3 w-3'} bg-green-500 rounded-full border-2 border-background`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className={`font-medium truncate ${textSize}`}>
                {participantProfile?.name || 'Unknown User'}
              </p>
              <span className={`text-muted-foreground ${timeSize}`}>
                {timeAgo}
              </span>
            </div>
            <p className={`text-muted-foreground truncate ${contentSize}`}>
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <span className={`flex items-center justify-center rounded-full bg-red-500 text-white font-semibold shadow-sm ${
              isDesktop ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs'
            }`}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.lastMessage?.id === nextProps.conversation.lastMessage?.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

ConversationItem.displayName = 'ConversationItem';

interface OptimizedConversationListProps {
  conversations: ConversationItem[];
  currentUserId?: string;
  activeConversationId?: string;
  isDesktop?: boolean;
}

// Main optimized conversation list with virtual scrolling for large lists
export const OptimizedConversationList = React.memo<OptimizedConversationListProps>(({
  conversations,
  currentUserId,
  activeConversationId,
  isDesktop = false
}) => {
  const containerHeight = 600; // Approximate height
  const itemHeight = isDesktop ? 80 : 100; // Approximate item height

  // Use virtual scrolling for large conversation lists
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualScroll(conversations, itemHeight, containerHeight);

  // For smaller lists, render all items normally
  if (conversations.length <= 20) {
    return (
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUserId}
            isActive={conversation.id === activeConversationId}
            isDesktop={isDesktop}
          />
        ))}
      </div>
    );
  }

  // Virtual scrolling for large lists
  return (
    <div 
      ref={scrollElementRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isActive={conversation.id === activeConversationId}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

OptimizedConversationList.displayName = 'OptimizedConversationList';
