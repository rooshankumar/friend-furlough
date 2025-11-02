import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import UserAvatar from '@/components/UserAvatar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileBio } from '@/components/profile/ProfileBio';
import { ProfileLanguages } from '@/components/profile/ProfileLanguages';
import { ProfilePosts } from '@/components/profile/ProfilePosts';
import { ProfileFriends } from '@/components/profile/ProfileFriends';
import { QuickStats } from '@/components/profile/QuickStats';
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
import { uploadAvatar } from '@/lib/storage';
import { mobileUploadHelper, getMobileInputAttributes, getMobileErrorMessage } from '@/lib/mobileUploadHelper';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const { user: authUser, profile: authProfile, updateProfile } = useAuthStore();
  
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
      const targetUserId = isOwnProfile ? authUser.id : userId!;

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
  }, [userId, authUser, isOwnProfile]);

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
      
      if (profileUser) {
        setProfileUser({ ...profileUser, avatar_url: result.url!, profilePhoto: result.url! });
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
      <ErrorState 
        title={error || 'Profile not found'}
        description="Failed to load profile data"
        onRetry={() => fetchProfileData(true)}
      />
    );
  }

  const stats = {
    friendsCount,
    postsCount: userPosts.length,
    languagesLearning: learningLanguages.length,
    culturalExchanges: 0,
    heartsReceived: reactions[profileUser.id] || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card-cultural/30 to-background md:ml-16 pb-20 md:pb-0">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchProfileData(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
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

        {/* Quick Stats */}
        <QuickStats stats={stats} isOwnProfile={isOwnProfile} />

        {/* Bio & Interests */}
        <ProfileBio
          profileUser={profileUser}
          culturalInterests={culturalInterests}
          lookingFor={lookingFor}
        />

        {/* Languages */}
        <ProfileLanguages
          profileUser={profileUser}
          nativeLanguages={nativeLanguages}
          learningLanguages={learningLanguages}
        />

        {/* Posts */}
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

        {/* Friends */}
        <ProfileFriends 
          profileUser={profileUser} 
          isOwnProfile={isOwnProfile} 
          friendsCount={friendsCount}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
