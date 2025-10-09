import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/UserAvatar';
import { CulturalBadge } from '@/components/CulturalBadge';
import { EditProfileModal } from '@/components/EditProfileModal';
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
      {/* Mobile Header */}
      <div className="md:hidden bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">
            {isOwnProfile ? 'My Profile' : profileUser?.name || 'Profile'}
          </h1>
          {isOwnProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <EditProfileModal 
                  trigger={
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="mr-2 h-4 w-4" />
                  Share Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Desktop Back Button */}
      {!isOwnProfile && (
        <div className="hidden md:block p-6 pb-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      {/* Main Header Content */}
      <div className="p-6 pt-4 md:pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <UserAvatar 
                profile={profileUser}
                user={isOwnProfile ? user : undefined}
                className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white shadow-xl"
                fallbackClassName="text-2xl sm:text-3xl"
              />
              {isOwnProfile && (
                <label htmlFor="avatar-upload">
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </span>
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarUpload}
                  />
                </label>
              )}
            </div>
            
            {/* Status & Basic Info */}
            <div className="text-center lg:text-left mt-4 space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{profileUser.city || ''}, {profileUser.country || ''}</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Joined {new Date(profileUser.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 lg:ml-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                  {profileUser.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <CulturalBadge type="country" flag={profileUser.countryFlag || ''}>{profileUser.country || ''}</CulturalBadge>
                  <Badge variant="outline" className="text-sm">
                    Age {profileUser.age || ''}
                  </Badge>
                  {profileUser.gender && (
                    <Badge variant="outline" className="text-sm flex items-center gap-1">
                      <img 
                        src={
                          profileUser.gender === 'male' 
                            ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/male.png'
                            : profileUser.gender === 'female'
                            ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/female.png'
                            : 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/others.png'
                        }
                        alt={profileUser.gender}
                        className="h-3 w-3"
                      />
                      {profileUser.gender === 'prefer-not-to-say' ? 'Other' : profileUser.gender.charAt(0).toUpperCase() + profileUser.gender.slice(1)}
                    </Badge>
                  )}
                  {profileUser.teachingExperience && (
                    <Badge className="bg-gradient-cultural text-white text-sm">
                      <Award className="h-3 w-3 mr-1" />
                      Teacher
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="text-sm font-medium text-red-700">
                        {reactions[profileUser.id] || 0}
                      </span>
                    </div>
                    <EditProfileModal />
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={onHeartReaction}
                      className={`flex items-center gap-2 ${userReactions[profileUser.id] ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-4 w-4 ${userReactions[profileUser.id] ? 'fill-current' : ''}`} />
                      <span className="text-sm">{reactions[profileUser.id] || 0}</span>
                    </Button>
                    <Button className="bg-gradient-cultural text-white" onClick={onStartConversation}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onFriendRequest}
                      disabled={friendStatus === 'accepted'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {friendStatus === 'pending' ? 'Cancel Request' : 
                       friendStatus === 'accepted' ? 'Friends' : 
                       friendStatus === 'received' ? 'Accept Request' :
                       'Add Friend'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare}>
                      <Share className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleReport} className="text-orange-600">
                          <Flag className="h-4 w-4 mr-2" />
                          Report User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                          <Ban className="h-4 w-4 mr-2" />
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
