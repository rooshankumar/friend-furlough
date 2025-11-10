import { usePresence, getOnlineStatus } from '@/hooks/usePresence';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Heart } from 'lucide-react';

interface UserCardWithPresenceProps {
  profile: any;
  onViewProfile: () => void;
  onMessage: () => void;
  onReaction: () => void;
  reactionCount: number;
  hasReacted: boolean;
  children?: React.ReactNode;
}

export function UserCardWithPresence({
  profile,
  onViewProfile,
  onMessage,
  onReaction,
  reactionCount,
  hasReacted,
  children
}: UserCardWithPresenceProps) {
  // Get real-time presence
  const { presence } = usePresence(profile.id);
  const { isOnline } = getOnlineStatus(presence);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow flex flex-col">
      <div className="flex gap-3 mb-3">
        <div 
          className="relative cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
          onClick={onViewProfile}
          title={`View ${profile.name}'s profile`}
        >
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{profile.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 
              className="text-sm font-semibold truncate cursor-pointer hover:text-primary"
              onClick={onViewProfile}
            >
              {profile.name}
            </h3>
            {profile.gender && (
              <img 
                src={
                  profile.gender === 'male' 
                    ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/male.png'
                    : profile.gender === 'female'
                    ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/female.png'
                    : 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/others.png'
                }
                alt={profile.gender}
                className="h-4 w-4 ml-2 flex-shrink-0"
              />
            )}
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            {profile.country && (
              <span className="truncate">{profile.countryFlag} {profile.country}</span>
            )}
            {profile.age && (
              <span>{profile.age}y</span>
            )}
          </div>

          {children}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onMessage}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Send
        </Button>
        <Button
          variant={hasReacted ? "default" : "outline"}
          size="sm"
          onClick={onReaction}
          className={hasReacted ? "text-red-500" : ""}
        >
          <Heart className={`h-4 w-4 ${hasReacted ? 'fill-current' : ''}`} />
          {reactionCount > 0 && <span className="ml-1">{reactionCount}</span>}
        </Button>
      </div>
    </Card>
  );
}
