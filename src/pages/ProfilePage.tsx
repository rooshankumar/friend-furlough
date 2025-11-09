import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import UserAvatar from '@/components/UserAvatar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfoGrid } from '@/components/profile/ProfileInfoGrid';
import { ProfilePosts } from '@/components/profile/ProfilePosts';
import { ProfileFriends } from '@/components/profile/ProfileFriends';
import { 
  MessageCircle, 
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useFriendRequestStore } from '@/stores/friendRequestStore';
import { useProfileReactionStore } from '@/stores/profileReactionStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfileLoadingSkeleton, ErrorState } from '@/components/LoadingStates';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { uploadAvatar } from '@/lib/storage';
import { mobileUploadHelper, getMobileInputAttributes, getMobileErrorMessage } from '@/lib/mobileUploadHelper';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  const { user: authUser, profile: authProfile, updateProfile } = useAuthStore();
  
  // Pull-to-refresh for profile
  const profilePullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      setIsRefreshing(true);
      setRefreshTrigger(prev => prev + 1);
      toast({ title: 'Profile refreshed' });
    },
    threshold: 80
  });
  
  // Convert auth profile to User type
  const currentUser: User | null = authProfile ? {
    id: authProfile.id,
    name: authProfile.name,
    email: authUser?.email || '',
    country: authProfile.country || '',
    countryCode: authProfile.country_code || '',
    countryFlag: authProfile.country_flag || '',
    city: authProfile.city || '',
    nativeLanguages: [],
    learningLanguages: [],
    culturalInterests: [],
    bio: authProfile.bio || '',
    age: authProfile.age || 0,
    gender: authProfile.gender,
    profilePhoto: authProfile.avatar_url,
    avatar_url: authProfile.avatar_url,
    online: authProfile.online,
    lastSeen: authProfile.last_seen,
    joinedDate: authProfile.created_at,
    languageGoals: authProfile.language_goals || [],
    lookingFor: authProfile.looking_for || [],
    teachingExperience: authProfile.teaching_experience || false,
    countriesVisited: authProfile.countries_visited || [],
    posts: []
  } : null;

  const { sendFriendRequest, unsendFriendRequest, checkFriendStatus, friendRequestStatus } = useFriendRequestStore();
  const { toggleReaction, loadReactionData, reactions, userReactions } = useProfileReactionStore();
  const { 
    toggleReaction: togglePostReaction, 
    reactions: postReactions, 
    userReactions: userPostReactions, 
    loadMultiplePostReactions 
  } = usePostReactionStore();
  const { commentCounts, loadMultiplePostComments } = usePostCommentStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [culturalInterests, setCulturalInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [friendsCount, setFriendsCount] = useState<number>(0);

  useEffect(() => {
    const isOwn = !userId || userId === authUser?.id;
    setIsOwnProfile(isOwn);
  }, [userId, authUser]);

  // Optimized data fetching - batch all requests
  const fetchProfileData = async (force = false) => {
    if (!authUser?.id) {
      setError('Please sign in to view profiles');
      setLoading(false);
      return;
    }

    if (force) setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const targetUserId = isOwnProfile ? authUser.id : userId;
      
      // Validate targetUserId
      if (!targetUserId || targetUserId === 'undefined') {
        setError('Invalid profile ID');
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Batch all data requests in parallel
      const [profileData, languagesData, postsData] = await Promise.all([
        // Profile data
        (async () => {
          const { fetchProfileById } = await import('@/integrations/supabase/fetchProfileById');
          return fetchProfileById(targetUserId);
        })(),
        // Languages data
        supabase
          .from('languages')
          .select('language_name, is_native, is_learning')
          .eq('user_id', targetUserId),
        // Posts data
        supabase
          .from('community_posts')
          .select('*, profiles!community_posts_user_id_fkey(name, avatar_url, country_flag)')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
      ]);

      if (!profileData) {
        setError('Profile not found');
        return;
      }

      // Set profile with synced avatar
      const fullProfile: User = {
        ...profileData,
        email: profileData.email || '',
        avatar_url: profileData.avatar_url || profileData.profilePhoto,
        profilePhoto: profileData.profilePhoto || profileData.avatar_url,
      };

      setProfileUser(fullProfile);

      // Set languages
      if (languagesData.data) {
        setNativeLanguages(languagesData.data.filter(l => l.is_native).map(l => l.language_name));
        setLearningLanguages(languagesData.data.filter(l => l.is_learning).map(l => l.language_name));
      }

      // Set posts
      setUserPosts(postsData.data || []);

      // Set interests from profile
      setCulturalInterests(profileData.culturalInterests || []);
      setLookingFor(profileData.lookingFor || []);

      // Load reactions and comments for posts
      if (postsData.data && postsData.data.length > 0) {
        const postIds = postsData.data.map((post: any) => post.id);
        await Promise.all([
          loadMultiplePostReactions(postIds, 'like'),
          loadMultiplePostComments(postIds)
        ]);
      }

      // Load profile reaction data
      await loadReactionData(fullProfile.id);

      // Load friends count
      try {
        const { count, error: friendsError } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);
        
        if (!friendsError && count !== null) {
          setFriendsCount(count);
        }
      } catch (error) {
        console.error('Error loading friends count:', error);
      }

      // Check friend status
      if (!isOwnProfile) {
        const status = await checkFriendStatus(targetUserId);
        setFriendStatus(status);
      }

    } catch (error: any) {
      console.error('Profile fetch error:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, authUser, isOwnProfile, refreshTrigger]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file || !authUser?.id) return;
    
    const validation = mobileUploadHelper.validateFile(file, {
      maxSizeMB: mobileUploadHelper.getRecommendedLimits().avatar,
      allowedTypes: ['image/']
    });
    
    if (!validation.valid) {
      toast({
        title: "Upload failed",
        description: getMobileErrorMessage(validation.error!),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const result = await mobileUploadHelper.uploadWithRetry(
        (f) => uploadAvatar(f, authUser.id),
        file,
        { enableRetry: true }
      );
      
      if (!result.success) throw new Error(result.error);
      
      await updateProfile({ avatar_url: result.url! });
      
      // Refresh profile data from database to get updated avatar
      await fetchProfileData();
      
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

  const handleFriendRequest = async () => {
    if (!profileUser?.id) return;
    
    if (friendStatus === 'pending') {
      const success = await unsendFriendRequest(profileUser.id);
      if (success) {
        setFriendStatus('none');
        toast({
          title: "Friend request cancelled",
          description: `Your friend request to ${profileUser.name} has been cancelled`,
        });
      }
    } else if (friendStatus === 'received') {
      toast({
        title: "Check your friend requests",
        description: `${profileUser.name} has sent you a friend request.`,
      });
      navigate('/friends');
    } else {
      const success = await sendFriendRequest(profileUser.id);
      if (success) {
        setFriendStatus('pending');
        toast({
          title: "Friend request sent!",
          description: `Your friend request has been sent to ${profileUser.name}`,
        });
      }
    }
  };

  const handleHeartReaction = async () => {
    if (!profileUser?.id) return;
    
    const wasReacted = userReactions[profileUser.id] || false;
    const success = await toggleReaction(profileUser.id);
    
    if (success) {
      toast({
        title: !wasReacted ? "Added to favorites!" : "Removed from favorites",
        description: !wasReacted 
          ? `You liked ${profileUser.name}'s profile` 
          : `You removed your like from ${profileUser.name}'s profile`,
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    await togglePostReaction(postId, 'like');
  };

  const startConversation = async () => {
    if (!profileUser?.id || profileUser.id === authUser?.id) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Please sign in',
          description: 'You need to be signed in to start a conversation',
          variant: 'destructive',
        });
        navigate('/auth/signin');
        return;
      }

      // Check for existing conversation
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', authUser!.id);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', profileUser.id)
            .maybeSingle();

          if (otherParticipant) {
            navigate(`/chat/${participant.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ is_language_exchange: true })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: authUser!.id },
          { conversation_id: conversation.id, user_id: profileUser.id }
        ]);

      if (participantsError) throw participantsError;

      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Failed to start conversation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading && !profileUser) {
    return <ProfileLoadingSkeleton />;
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background md:ml-16 pb-20 md:pb-0 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorState 
            title={error || 'Profile not found'}
            description={
              error?.includes('Invalid') 
                ? "The profile link appears to be invalid. Please check the URL or go to your profile."
                : "Failed to load profile data. Please try again."
            }
            onRetry={() => {
              if (error?.includes('Invalid')) {
                navigate('/profile');
              } else {
                fetchProfileData(true);
              }
            }}
          />
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              Go to My Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={profilePullToRefresh.containerRef} className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background md:ml-16 pb-20 md:pb-0 overflow-auto relative">
      <PullToRefreshIndicator 
        pullDistance={profilePullToRefresh.pullDistance}
        isRefreshing={profilePullToRefresh.isRefreshing}
        threshold={80}
      />
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 hover:bg-primary/10 h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h2 className="text-sm font-semibold truncate max-w-[200px]">
            {isOwnProfile ? 'My Profile' : profileUser?.name}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchProfileData(true)}
            disabled={isRefreshing}
            className="gap-1.5 hover:bg-primary/10 h-8 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Compact Content Layout */}
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Profile Header - Compact */}
        <div className="animate-fade-in">
          <ProfileHeader
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            user={currentUser}
            reactions={reactions}
            userReactions={userReactions}
            friendStatus={friendStatus}
            isUploading={isUploading}
            onAvatarUpload={handleAvatarUpload}
            onFriendRequest={handleFriendRequest}
            onStartConversation={startConversation}
            onHeartReaction={handleHeartReaction}
          />
        </div>

        {/* Bio & Languages - Two Column Grid */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <ProfileInfoGrid
            profileUser={profileUser}
            culturalInterests={culturalInterests}
            lookingFor={lookingFor}
            nativeLanguages={nativeLanguages}
            learningLanguages={learningLanguages}
          />
        </div>

        {/* Friends - Horizontal Row */}
        <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <ProfileFriends 
            profileUser={profileUser} 
            isOwnProfile={isOwnProfile} 
            friendsCount={friendsCount}
          />
        </div>

        {/* Posts - Horizontal Carousel */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <ProfilePosts
            userPosts={userPosts}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            user={currentUser}
            postReactions={postReactions}
            userPostReactions={userPostReactions}
            commentCounts={commentCounts}
            onLikePost={handleLikePost}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
