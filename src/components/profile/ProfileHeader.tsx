import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/UserAvatar';
import { CulturalBadge } from '@/components/CulturalBadge';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Settings, 
  Share, 
  MessageCircle, 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  Award,
  Camera,
  Loader2,
  Flag,
  Ban
} from 'lucide-react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
  user?: User | null;
  reactions: Record<string, number>;
  userReactions: Record<string, boolean>;
  friendStatus: string;
  isUploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHeartReaction: () => void;
  onFriendRequest: () => void;
  onStartConversation: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileUser,
  isOwnProfile,
  user,
  reactions,
  userReactions,
  friendStatus,
  isUploading,
  onAvatarUpload,
  onHeartReaction,
  onFriendRequest,
  onStartConversation
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: `Thank you for reporting. We'll review ${profileUser?.name}'s account.`,
    });
  };

  const handleBlock = () => {
    toast({
      title: "User blocked",
      description: `You have blocked ${profileUser?.name}. You won't see their content anymore.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileUser.name}'s Profile`,
        text: `Check out ${profileUser.name}'s profile on Friend Furlough!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to clipboard.",
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-xl border border-border/50 overflow-hidden">
      {/* Compact All-in-One Header */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Avatar Section - Compact */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-start md:items-center gap-3 sm:gap-4 md:gap-3">
            <div className="relative flex-shrink-0">
              <UserAvatar 
                profile={profileUser}
                user={isOwnProfile ? user : undefined}
                className="h-20 w-20 md:h-24 md:w-24 border-4 border-white shadow-lg"
                fallbackClassName="text-xl md:text-2xl"
              />
              {isOwnProfile && (
                <label htmlFor="avatar-upload">
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 rounded-full h-8 w-8 p-0 shadow-lg"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                    </span>
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={onAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            
            {/* Online Status - Mobile/Tablet */}
            <div className="flex sm:hidden md:flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>

          {/* Profile Info - Compact Horizontal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                    {profileUser.name}
                  </h1>
                  {/* Online Status - Desktop */}
                  <div className="hidden sm:flex md:hidden items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
                
                {/* Compact Info Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{profileUser.city || ''}, {profileUser.country || ''}</span>
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Age {profileUser.age || ''}</span>
                  </div>
                  <span className="text-border">•</span>
                  <span>Joined {new Date(profileUser.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Compact Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {profileUser.countryFlag} {profileUser.country || ''}
                  </Badge>
                  {profileUser.gender && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                      <img 
                        src={
                          profileUser.gender === 'male' 
                            ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/male.png'
                            : profileUser.gender === 'female'
                            ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/female.png'
                            : 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/others.png'
                        }
                        alt={profileUser.gender}
                        className="h-2.5 w-2.5"
                      />
                      {profileUser.gender === 'prefer-not-to-say' ? 'Other' : profileUser.gender.charAt(0).toUpperCase() + profileUser.gender.slice(1)}
                    </Badge>
                  )}
                  {profileUser.teachingExperience && (
                    <Badge className="bg-gradient-cultural text-white text-xs px-2 py-0.5">
                      <Award className="h-2.5 w-2.5 mr-1" />
                      Teacher
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons - Compact */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {isOwnProfile ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                      <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
                      <span className="text-xs font-medium text-red-700">
                        {reactions[profileUser.id] || 0}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="h-8 px-2">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 px-2">
                      <Share className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={onHeartReaction}
                      className={`h-8 px-2 ${userReactions[profileUser.id] ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${userReactions[profileUser.id] ? 'fill-current' : ''}`} />
                      <span className="text-xs ml-1">{reactions[profileUser.id] || 0}</span>
                    </Button>
                    <Button size="sm" className="bg-gradient-cultural text-white h-8 text-xs" onClick={onStartConversation}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={onFriendRequest}
                      disabled={friendStatus === 'accepted'}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {friendStatus === 'pending' ? 'Pending' : 
                       friendStatus === 'accepted' ? 'Friends' : 
                       friendStatus === 'received' ? 'Accept' :
                       'Add'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 px-2">
                      <Share className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleReport} className="text-orange-600 text-xs">
                          <Flag className="h-3.5 w-3.5 mr-2" />
                          Report User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBlock} className="text-red-600 text-xs">
                          <Ban className="h-3.5 w-3.5 mr-2" />
                          Block User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
