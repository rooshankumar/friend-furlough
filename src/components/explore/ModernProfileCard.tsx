import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageCircle, Heart, Eye, MapPin, Clock, Star, Zap } from 'lucide-react';
import { User } from '@/types';

interface ModernProfileCardProps {
  profile: User;
  isOnline: boolean;
  favoriteCount: number;
  isUserFavorite: boolean;
  matchPercentage?: number;
  onStartConversation: (profileId: string) => void;
  onToggleFavorite: (profileId: string) => void;
  onViewProfile: (profile: User) => void;
  isCreatingConversation: boolean;
}

export function ModernProfileCard({
  profile,
  isOnline,
  favoriteCount,
  isUserFavorite,
  matchPercentage = 0,
  onStartConversation,
  onToggleFavorite,
  onViewProfile,
  isCreatingConversation
}: ModernProfileCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewProfile(profile)}>
      {/* Avatar + Name + Age + Gender */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-14 w-14">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-lg font-medium">{profile.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">{profile.name}</h3>
            {profile.age && <span className="text-muted-foreground">{profile.age}</span>}
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
                className="h-4 w-4"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {profile.countryFlag} {profile.country}
          </p>
        </div>
      </div>

      {/* Native Languages */}
      {profile.nativeLanguages.length > 0 && (
        <div className="mb-2">
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Speaks:</span>
            {profile.nativeLanguages.slice(0, 3).map((lang, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs h-5 px-2">
                {lang}
              </Badge>
            ))}
            {profile.nativeLanguages.length > 3 && (
              <span className="text-xs text-muted-foreground">+{profile.nativeLanguages.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Learning Languages */}
      {profile.learningLanguages.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Learning:</span>
            {profile.learningLanguages.slice(0, 3).map((lang, idx) => (
              <Badge key={idx} variant="outline" className="text-xs h-5 px-2">
                {lang}
              </Badge>
            ))}
            {profile.learningLanguages.length > 3 && (
              <span className="text-xs text-muted-foreground">+{profile.learningLanguages.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Chat Button + Heart Count */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          onClick={() => onStartConversation(profile.id)}
          disabled={isCreatingConversation}
          className="flex-1 h-9"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {isCreatingConversation ? 'Starting...' : 'Chat'}
        </Button>
        
        <div className="flex items-center -space-x-2 md:space-x-0">
          <button
            onClick={() => onToggleFavorite(profile.id)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <svg 
              viewBox="0 0 24 24" 
              className={`h-5 w-5 ${isUserFavorite ? 'fill-red-500 text-red-500' : 'fill-none stroke-current'}`}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          
          {favoriteCount > 0 && (
            <span className="text-sm font-medium text-muted-foreground ml-1 md:ml-3">
              {favoriteCount}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
