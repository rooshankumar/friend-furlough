import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Trash2, Ban, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConversationHeaderProps {
  otherParticipant?: {
    user_id: string;
    profiles?: {
      id: string;
      name: string;
      avatar_url?: string;
      country_flag?: string;
      online?: boolean;
      last_seen?: string;
    };
  };
  typingUsers: string[];
  onDelete?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}

const getLastSeenText = (profile?: any): string => {
  let lastSeen = profile?.last_seen || profile?.updated_at || profile?.created_at;
  
  if (!lastSeen) {
    return 'Last seen recently';
  }
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  
  if (isNaN(lastSeenDate.getTime())) {
    return 'Last seen recently';
  }
  
  const diffInMs = now.getTime() - lastSeenDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMs < 0) return 'Last seen just now';
  if (diffInMinutes < 1) return 'Last seen just now';
  if (diffInMinutes < 60) return `Last seen ${diffInMinutes}m ago`;
  if (diffInHours < 24) return `Last seen ${diffInHours}h ago`;
  if (diffInDays < 7) return `Last seen ${diffInDays}d ago`;
  
  return 'Last seen a while ago';
};

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  otherParticipant,
  typingUsers,
  onDelete,
  onBlock,
  onReport,
}) => {
  const navigate = useNavigate();
  const profile = otherParticipant?.profiles;
  const isOnline = profile?.online;

  return (
    <div className="sticky top-0 z-20 flex-shrink-0 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between p-3 md:p-4">
        {/* Left: Back button and user info */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0 md:hidden"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div
            className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => profile?.id && navigate(`/profile/${profile.id}`)}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 md:h-12 md:w-12">
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm md:text-base font-semibold truncate">
                  {profile?.name || 'Unknown User'}
                </h2>
                {profile?.country_flag && (
                  <span className="text-sm flex-shrink-0">{profile.country_flag}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {typingUsers.length > 0 ? (
                  <span className="text-primary font-medium">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  getLastSeenText(profile)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onBlock && (
              <DropdownMenuItem onClick={onBlock}>
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
            {onReport && (
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
