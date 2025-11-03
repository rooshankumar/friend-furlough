import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Video, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  otherParticipant?: any;
  onBack: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
}

const getLastSeenText = (profile?: any): string => {
  const lastSeen = profile?.last_seen || profile?.updated_at || profile?.created_at;
  
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

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherParticipant,
  onBack,
  onBlock,
  onReport,
  onDelete
}) => {
  const profile = otherParticipant?.profiles;
  const isOnline = profile?.online;

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-border bg-card/95 backdrop-blur-md shadow-sm">{/* Rest of header content */}
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="shrink-0 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Profile Info */}
      <Link
        to={`/profile/${profile?.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Online Status Indicator */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground truncate">
              {profile?.name}
            </h2>
            {profile?.country_flag && (
              <span className="text-sm shrink-0">{profile.country_flag}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {isOnline ? (
              <span className="text-green-500 font-medium">Online</span>
            ) : (
              getLastSeenText(profile)
            )}
          </p>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Video className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReport}>
              Report User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock}>
              Block User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
