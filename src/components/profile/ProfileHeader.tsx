import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Ban,
  Upload,
  Eye
} from 'lucide-react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { usePresence, getOnlineStatus } from '@/hooks/usePresence';

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
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  
  // Get real-time presence status
  const { presence } = usePresence(profileUser?.id);
  const { isOnline, status } = getOnlineStatus(presence);

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
              <div 
                className="cursor-pointer group"
                onClick={() => {
                  if (isOwnProfile) {
                    setShowAvatarDialog(true);
                  } else if (profileUser.avatar_url || profileUser.profilePhoto) {
                    navigate(`/image-viewer?url=${encodeURIComponent(profileUser.avatar_url || profileUser.profilePhoto || '')}`);
                  }
                }}
              >
                <UserAvatar 
                  profile={profileUser}
                  user={isOwnProfile ? user : undefined}
                  className="h-40 w-40 sm:h-44 sm:w-44 md:h-36 md:w-36 border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                  fallbackClassName="text-4xl sm:text-5xl md:text-3xl"
                />
                {!isOwnProfile && (profileUser.avatar_url || profileUser.profilePhoto) && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-colors flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
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
            {!isOwnProfile && (
              <div className="flex sm:hidden md:flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500 animate-pulse' : 
                  status === 'away' ? 'bg-yellow-500' : 
                  'bg-gray-400'
                }`}></div>
                <span className="text-xs text-muted-foreground capitalize">{status}</span>
              </div>
            )}
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
                  {!isOwnProfile && (
                    <div className="hidden sm:flex md:hidden items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-green-500 animate-pulse' : 
                        status === 'away' ? 'bg-yellow-500' : 
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-xs text-muted-foreground capitalize">{status}</span>
                    </div>
                  )}
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                      <span className="text-sm font-medium text-red-700">
                        {reactions[profileUser.id] || 0}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="h-9 px-3">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare} className="h-9 px-3">
                      <Share className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={onHeartReaction}
                      className={`h-9 px-3 ${userReactions[profileUser.id] ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-5 w-5 ${userReactions[profileUser.id] ? 'fill-current' : ''}`} />
                      <span className="text-sm ml-1.5">{reactions[profileUser.id] || 0}</span>
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

      {/* Avatar Options Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                navigate(`/image-viewer?url=${encodeURIComponent(profileUser.avatar_url || profileUser.profilePhoto || '')}`);
                setShowAvatarDialog(false);
              }}
            >
              <Eye className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Full Photo</div>
                <div className="text-xs text-muted-foreground">See your profile picture</div>
              </div>
            </Button>
            
            <label htmlFor="avatar-upload-dialog">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                asChild
                disabled={isUploading}
              >
                <span>
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 mr-3" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">Upload New Photo</div>
                    <div className="text-xs text-muted-foreground">Change your profile picture</div>
                  </div>
                </span>
              </Button>
              <input
                id="avatar-upload-dialog"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  onAvatarUpload(e);
                  setShowAvatarDialog(false);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileHeader;
