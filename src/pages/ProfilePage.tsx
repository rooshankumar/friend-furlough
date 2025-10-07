import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Globe, 
  Calendar,
  MapPin,
  Languages,
  Heart,
  Users,
  BookOpen,
  Camera,
  Settings,
  Share,
  MoreHorizontal,
  Award,
  Plane,
  Music,
  Utensils,
  Loader2,
  Flag,
  Ban,
  UserX,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useFriendRequestStore } from '@/stores/friendRequestStore';
import { useProfileReactionStore } from '@/stores/profileReactionStore';
import { CulturalBadge } from '@/components/CulturalBadge';
import { uploadAvatar } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const { user, profile: authProfile, updateProfile } = useAuthStore();
  const { sendFriendRequest, unsendFriendRequest, checkFriendStatus, checkAreFriends, friendRequestStatus, areFriends } = useFriendRequestStore();
  const { toggleReaction, loadReactionData, reactions, userReactions } = useProfileReactionStore();

  useEffect(() => {
    // Check if viewing own profile - either no username or username matches user ID
    setIsOwnProfile(!username || username === user?.id);
  }, [username, user]);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('No authenticated user found');
      setError('Please sign in to view profiles');
      setLoading(false);
      return;
    }
    
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      
      try {
        let targetUserId = user.id;
        
        // If viewing someone else's profile, use the username as user ID
        if (!isOwnProfile && username) {
          console.log('Fetching profile for user ID:', username);
          targetUserId = username;
        }
        
        console.log('Fetching profile for user:', targetUserId);
        
        // Always fetch fresh profile data to ensure avatar is up to date
        const { fetchProfileById } = await import('@/integrations/supabase/fetchProfileById');
        const profile = await fetchProfileById(targetUserId);
        
        if (!profile) {
          console.error('No profile found for user:', targetUserId);
          setError('Profile not found');
          setProfileUser(null);
          return;
        }

        // Merge profile data
        const fullProfile: User = {
          ...profile,
          email: profile.email || '',  // Use profile's email, not current user's
          avatar_url: profile.avatar_url || profile.profilePhoto,
          profilePhoto: profile.profilePhoto || profile.avatar_url,
        };

        console.log('Setting profile data:', fullProfile);
        console.log('Avatar URL:', fullProfile.avatar_url);
        setProfileUser(fullProfile);
        
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        setError(error.message || 'Failed to load profile');
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [username, user, isOwnProfile]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setIsUploading(true);
      const avatarUrl = await uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: avatarUrl });
      
      if (profileUser) {
        setProfileUser({ ...profileUser, avatar_url: avatarUrl, profilePhoto: avatarUrl });
      }
      
      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Real-time data states
  const [postsCount, setPostsCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [languagesCount, setLanguagesCount] = useState(0);
  const [exchangesCount, setExchangesCount] = useState(0);
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [culturalInterests, setCulturalInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  
  // Fetch all real-time data
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchAllData = async () => {
      try {
        // Determine which user's data to fetch
        const targetUserId = profileUser?.id || user.id;
        console.log('Fetching real-time data for user:', targetUserId);
        
        // Fetch posts from community_posts
        try {
          const { data: postsData, count: postsCount, error: postsError } = await supabase
            .from('community_posts')
            .select('*', { count: 'exact' })
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
          
          console.log('Posts data:', postsData, 'Count:', postsCount, 'Error:', postsError);
          if (postsError) {
            console.error('Posts table error:', postsError);
            setPostsCount(0);
            setUserPosts([]);
          } else {
            setPostsCount(postsCount || 0);
            setUserPosts(postsData || []);
          }
        } catch (error) {
          console.error('Posts table may not exist:', error);
          setPostsCount(0);
          setUserPosts([]);
        }

        // Fetch actual friendships count
        try {
          const { count: friendsCount, error: friendsError } = await (supabase as any)
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);
          
          console.log('Friends count:', friendsCount, 'Error:', friendsError);
          if (friendsError) {
            console.error('Friendships table error:', friendsError);
            setFriendsCount(0);
          } else {
            setFriendsCount(friendsCount || 0);
          }
        } catch (error) {
          console.error('Friendships table may not exist:', error);
          setFriendsCount(0);
        }

        // Fetch languages count
        try {
          const { data: languages, error: languagesError } = await supabase
            .from('languages')
            .select('language_name, is_native, is_learning')
            .eq('user_id', targetUserId);

          console.log('Languages data:', languages, 'Error:', languagesError);
          
          if (languagesError) {
            console.error('Languages table error:', languagesError);
            setLanguagesCount(0);
            setNativeLanguages([]);
            setLearningLanguages([]);
          } else if (languages) {
            const native = languages.filter(l => l.is_native).map(l => l.language_name);
            const learning = languages.filter(l => l.is_learning).map(l => l.language_name);
            
            // Get unique languages
            const uniqueLanguages = new Set([...native, ...learning]);
            
            setNativeLanguages(native);
            setLearningLanguages(learning);
            setLanguagesCount(uniqueLanguages.size);
          } else {
            setLanguagesCount(0);
            setNativeLanguages([]);
            setLearningLanguages([]);
          }
        } catch (error) {
          console.error('Languages table may not exist:', error);
          setLanguagesCount(0);
          setNativeLanguages([]);
          setLearningLanguages([]);
        }

        // Fetch conversations/exchanges count
        try {
          const { count: conversationsCount, error: conversationsError } = await supabase
            .from('conversation_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId);
          
          console.log('Conversations count:', conversationsCount, 'Error:', conversationsError);
          if (conversationsError) {
            console.error('Conversations table error:', conversationsError);
            setExchangesCount(0);
          } else {
            setExchangesCount(conversationsCount || 0);
          }
        } catch (error) {
          console.error('Conversations table may not exist:', error);
          setExchangesCount(0);
        }

        // Fetch cultural interests and looking for from profile
        if (profileUser) {
          setCulturalInterests(profileUser.culturalInterests || []);
          setLookingFor(profileUser.lookingFor || []);
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    fetchAllData();
  }, [user?.id, profileUser]);

  // Check friend status for other users
  useEffect(() => {
    if (!isOwnProfile && profileUser?.id && user?.id) {
      checkFriendStatus(profileUser.id).then(setFriendStatus);
    }
  }, [isOwnProfile, profileUser?.id, user?.id, checkFriendStatus]);

  // Load reaction data when profile loads
  useEffect(() => {
    if (profileUser?.id) {
      loadReactionData(profileUser.id);
    }
  }, [profileUser?.id, loadReactionData]);

  const handleFriendRequest = async () => {
    if (!profileUser?.id) return;
    
    if (friendStatus === 'pending') {
      // Unsend the request
      const success = await unsendFriendRequest(profileUser.id);
      if (success) {
        setFriendStatus('none');
        toast({
          title: "Friend request cancelled",
          description: `Your friend request to ${profileUser.name} has been cancelled`,
        });
      } else {
        toast({
          title: "Failed to cancel request",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } else if (friendStatus === 'received') {
      // This user sent you a request, redirect to friends page
      toast({
        title: "Check your friend requests",
        description: `${profileUser.name} has sent you a friend request. Check your Friends page to accept it.`,
      });
      navigate('/friends');
    } else {
      // Send new request
      const success = await sendFriendRequest(profileUser.id);
      if (success) {
        setFriendStatus('pending');
        toast({
          title: "Friend request sent!",
          description: `Your friend request has been sent to ${profileUser.name}`,
        });
      } else {
        // Check if request already exists
        const currentStatus = await checkFriendStatus(profileUser.id);
        setFriendStatus(currentStatus);
        
        if (currentStatus === 'pending') {
          toast({
            title: "Request already sent",
            description: `You've already sent a friend request to ${profileUser.name}`,
          });
        } else if (currentStatus === 'accepted') {
          toast({
            title: "Already friends",
            description: `You and ${profileUser.name} are already friends!`,
          });
        } else {
          toast({
            title: "Failed to send request",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      }
    }
  };

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

  const handleHeartReaction = async () => {
    if (!profileUser?.id) return;
    
    // Get the current state BEFORE toggling
    const wasReacted = userReactions[profileUser.id] || false;
    
    const success = await toggleReaction(profileUser.id);
    if (success) {
      toast({
        title: !wasReacted ? "Added to favorites!" : "Removed from favorites",
        description: !wasReacted 
          ? `You liked ${profileUser.name}'s profile` 
          : `You removed your like from ${profileUser.name}'s profile`,
      });
    } else {
      toast({
        title: "Failed to update reaction",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Real-time stats
  const stats = {
    friendsCount: friendsCount,
    postsCount: postsCount,
    languagesLearning: languagesCount,
    culturalExchanges: exchangesCount,
    heartsReceived: reactions[profileUser?.id || ''] || 0
  };
  const languageProgress = [];


  if (!user) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Please sign in to view profiles</p>
    </div>
  );

  if (loading) return (
    <div className="p-8 text-center">
      <p>Loading profile...</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
    </div>
  );
  
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500">{error}</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
      <pre className="mt-4 text-left text-xs text-gray-600 bg-gray-100 p-4 rounded">
        Debug info:
        {JSON.stringify({ user, profileUser }, null, 2)}
      </pre>
      <button 
        className="mt-4 text-blue-500 text-sm"
        onClick={() => window.location.reload()}
      >
        Retry loading profile
      </button>
    </div>
  );
  
  if (!profileUser) return (
    <div className="p-8 text-center">
      <p>Profile not found</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
      <button 
        className="mt-4 text-blue-500 text-sm"
        onClick={() => window.location.reload()}
      >
        Retry loading profile
      </button>
    </div>
  );

  // Debug: show raw profile data if something is wrong
  if (profileUser && typeof profileUser === 'object' && !profileUser.name) {
    return (
      <div className="p-8 text-center text-yellow-600">
        Profile loaded but missing expected fields.<br />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-2 sm:pt-4 md:pt-0">
      <div className="p-3 sm:p-4 md:p-8 max-w-6xl mx-auto">
        {/* Back Button for Other Users' Profiles */}
        {!isOwnProfile && (
          <div className="mb-4">
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

        {/* Profile Header */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <UserAvatar 
                    profile={profileUser}
                    user={isOwnProfile ? user : undefined}
                    className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20"
                    fallbackClassName="text-xl sm:text-2xl"
                  />
                  {isOwnProfile && (
                    <label htmlFor="avatar-upload">
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
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
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  )}
                </div>
                
                {/* Status & Location */}
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {profileUser.name}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <CulturalBadge type="country" flag={profileUser.countryFlag || ''}>{profileUser.country || ''}</CulturalBadge>
                      <Badge variant="outline" className="text-xs">
                        Age {profileUser.age || ''}
                      </Badge>
                      {profileUser.gender && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
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
                        <Badge className="bg-gradient-cultural text-white text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Teacher
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                          <span className="text-sm font-medium text-red-700">
                            {reactions[profileUser.id] || 0} Hearts
                          </span>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/settings')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleHeartReaction}
                          className={`flex items-center gap-1 ${userReactions[profileUser.id] ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          <Heart className={`h-4 w-4 ${userReactions[profileUser.id] ? 'fill-current' : ''}`} />
                          <span className="text-xs">{reactions[profileUser.id] || 0}</span>
                        </Button>
                        <Button className="bg-gradient-cultural text-white">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleFriendRequest}
                          disabled={friendStatus === 'accepted'}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {friendStatus === 'pending' ? 'Cancel Request' : 
                           friendStatus === 'accepted' ? 'Friends' : 
                           friendStatus === 'received' ? 'Accept Request' :
                           'Add Friend'}
                        </Button>
                        <Button variant="ghost" size="sm">
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

                {/* Bio */}
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {profileUser.bio}
                </p>

                {/* Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Native Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(profileUser.nativeLanguages || []).map((lang: string) => (
                        <Badge key={lang} className="bg-gradient-cultural text-white">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Native Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {nativeLanguages.map((lang: string) => (
                        <CulturalBadge key={lang} type="language-native">
                          {lang}
                        </CulturalBadge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Learning Languages */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Learning Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {learningLanguages.map((lang: string) => (
                      <CulturalBadge key={lang} type="language-learning">
                        {lang}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>

                {/* Cultural Interests */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Cultural Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {culturalInterests.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        #{interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Looking For */}
                {lookingFor.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Looking For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lookingFor.map((item: string) => (
                        <Badge key={item} className="bg-primary/10 text-primary border-primary/20">
                          {item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Countries Visited */}
                {profileUser.countriesVisited && profileUser.countriesVisited.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Countries Visited ({profileUser.countriesVisited.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.countriesVisited.map((country: string) => (
                        <Badge key={country} variant="outline" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.friendsCount}</div>
                    <div className="text-xs text-muted-foreground">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.languagesLearning}</div>
                    <div className="text-xs text-muted-foreground">Languages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.culturalExchanges}</div>
                    <div className="text-xs text-muted-foreground">Exchanges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 flex items-center justify-center gap-1">
                      <Heart className="h-5 w-5 fill-current" />
                      {stats.heartsReceived}
                    </div>
                    <div className="text-xs text-muted-foreground">Hearts</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Share your thoughts and experiences with the community!" 
                    : `${profileUser.name} hasn't posted anything yet.`}
                </p>
                {isOwnProfile && (
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/community')}
                  >
                    Create Your First Post
                  </Button>
                )}
              </div>
            ) : (
              userPosts.map((post: any) => (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <UserAvatar 
                          profile={profileUser}
                          user={isOwnProfile ? user : undefined}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-semibold">{profileUser.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mb-4">
                      {post.content}
                    </p>
                    {post.image_url && (
                      <div className="mb-4">
                        <img 
                          src={post.image_url} 
                          alt="Post image" 
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {Array.isArray(post.reactions) ? post.reactions.length : 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {Array.isArray(post.comments) ? post.comments.length : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Language Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(languageProgress || []).length === 0 ? (
                  <div className="text-center text-muted-foreground">No language progress data.</div>
                ) : (
                  (languageProgress || []).map((lang: any) => (
                    <div key={lang.language} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lang.language}</span>
                          <Badge variant="outline" className="text-xs">
                            {lang.level}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {lang.progress}%
                        </span>
                      </div>
                      <Progress value={lang.progress} className="h-2" />
                    </div>
                  ))
                )}
                
                {/* Language Goals */}
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Language Goals</h3>
                  <div className="space-y-2">
                    {(profileUser.languageGoals || []).length === 0 ? (
                      <div className="text-center text-muted-foreground">No language goals set.</div>
                    ) : (
                      (profileUser.languageGoals || []).map((goal: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">{goal}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Culture Tab */}
          <TabsContent value="culture" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cultural Background */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Cultural Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{profileUser.countryFlag}</span>
                    <div>
                      <p className="font-medium">{profileUser.country}</p>
                      <p className="text-sm text-muted-foreground">{profileUser.city}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Countries Visited
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(profileUser.countriesVisited || []).map((country: string) => (
                        <Badge key={country} variant="outline" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Interests */}
              <Card>
                <CardHeader>
                  <CardTitle>Cultural Passions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Music className="h-5 w-5 text-primary" />
                      <span className="text-sm">Music</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Utensils className="h-5 w-5 text-primary" />
                      <span className="text-sm">Food</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="text-sm">Travel</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm">Festivals</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">
                    Activity tracking is not yet implemented. This will show real user activities in the future.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;