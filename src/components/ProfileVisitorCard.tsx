import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProfileVisitorCardProps {
  visitor: {
    id: string;
    viewer_id: string;
    viewed_at: string;
    viewer: {
      id: string;
      name: string;
      avatar_url?: string;
      country_flag?: string;
      city?: string;
      country?: string;
    };
    view_count?: number;
  };
}

const ProfileVisitorCard = ({ visitor }: ProfileVisitorCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${visitor.viewer_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-14 w-14 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
          <AvatarImage src={visitor.viewer.avatar_url} />
          <AvatarFallback className="text-lg bg-gradient-cultural text-white">
            {visitor.viewer.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* View indicator */}
        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 shadow-sm">
          <Eye className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {visitor.viewer.name}
          </h3>
          {visitor.viewer.country_flag && (
            <span className="text-sm">{visitor.viewer.country_flag}</span>
          )}
        </div>
        
        {visitor.viewer.city && visitor.viewer.country && (
          <p className="text-xs text-muted-foreground truncate mb-1">
            {visitor.viewer.city}, {visitor.viewer.country}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(visitor.viewed_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* View count badge (if multiple views) */}
      {visitor.view_count && visitor.view_count > 1 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {visitor.view_count}
        </Badge>
      )}
    </div>
  );
};

export default ProfileVisitorCard;
