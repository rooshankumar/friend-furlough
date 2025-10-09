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
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { QuickStats } from '@/components/profile/QuickStats';
import { ProfileBio } from '@/components/profile/ProfileBio';
import { ProfileLanguages } from '@/components/profile/ProfileLanguages';
import { ProfilePosts } from '@/components/profile/ProfilePosts';
import { ProfileFriends } from '@/components/profile/ProfileFriends';
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
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { CulturalBadge } from '@/components/CulturalBadge';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfileLoadingSkeleton, ErrorState } from '@/components/LoadingStates';
import { uploadAvatar } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const { user: authUser, profile: authProfile, updateProfile } = useAuthStore();
  
  // Convert auth profile to User type for components
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
    countriesVisited: authProfile.countries_visited || []
  } : null;
  const { sendFriendRequest, unsendFriendRequest, checkFriendStatus, checkAreFriends, friendRequestStatus, areFriends } = useFriendRequestStore();
  const { toggleReaction, loadReactionData, reactions, userReactions } = useProfileReactionStore();
  const { 
    toggleReaction: togglePostReaction, 
    reactions: postReactions, 
    userReactions: userPostReactions, 
    loadMultiplePostReactions 
  } = usePostReactionStore();
  const { 
    loadComments, 
    commentCounts, 
    loadMultiplePostComments 
  } = usePostCommentStore();

  useEffect(() => {
    // Check if viewing own profile - either no userId or userId matches user ID
    const isOwn = !userId || userId === authUser?.id;
    console.log('Profile page - userId:', userId, 'authUser.id:', authUser?.id, 'isOwnProfile:', isOwn);
    setIsOwnProfile(isOwn);
  }, [userId, authUser]);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.id) {
      console.log('No authenticated user found');
      setError('Please sign in to view profiles');
      setLoading(false);
      return;
    }
    
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      
      try {
        let targetUserId = authUser.id;
        
        // If viewing someone else's profile, use the userId as user ID
        if (!isOwnProfile && userId) {
          console.log('Fetching profile for user ID:', userId);
          targetUserId = userId;
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
  }, [userId, authUser, isOwnProfile]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) return;

    try {
      setIsUploading(true);
      const avatarUrl = await uploadAvatar(file, authUser.id);
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
    if (!authUser?.id) return;
    
    const fetchAllData = async () => {
      try {
        // Determine which user's data to fetch
        const targetUserId = profileUser?.id || authUser.id;
        console.log('Fetching real-time data for user:', targetUserId);
        
        // Fetch posts from community_posts
        try {
          const { data: postsData, count: postsCount, error: postsError } = await supabase
            .from('community_posts')
            .select(`
              *,
              profiles!community_posts_user_id_fkey (
                name,
                avatar_url,
                country_flag
              )
            `, { count: 'exact' })
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
  }, [authUser?.id, profileUser]);

  // Check friend status for other users
  useEffect(() => {
    if (!isOwnProfile && profileUser?.id && authUser?.id) {
      checkFriendStatus(profileUser.id).then(setFriendStatus);
    }
  }, [isOwnProfile, profileUser?.id, authUser?.id, checkFriendStatus]);

  // Load reaction data when profile loads
  useEffect(() => {
    if (profileUser?.id) {
      loadReactionData(profileUser.id);
    }
  }, [profileUser?.id, loadReactionData]);

  // Load post reactions and comments when posts are loaded
  useEffect(() => {
    if (userPosts.length > 0) {
      const postIds = userPosts.map(post => post.id);
      loadMultiplePostReactions(postIds, 'like');
      loadMultiplePostComments(postIds);
    }
  }, [userPosts, loadMultiplePostReactions, loadMultiplePostComments]);

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

  // Handle like/reaction toggle for posts
  const handleLikePost = async (postId: string) => {
    const success = await togglePostReaction(postId, 'like');
    if (!success) {
      toast({
        title: "Failed to update reaction",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const startConversation = async () => {
    if (!profileUser?.id) return;
    
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

      if (profileUser.id === authUser?.id) return;

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

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ is_language_exchange: true })
        .select()
        .single();

      if (convError) {
        toast({ title: 'Failed to start conversation', description: convError.message, variant: 'destructive' });
        return;
      }

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: session.user.id },
          { conversation_id: conversation.id, user_id: profileUser.id }
        ]);

      if (participantError) {
        toast({ title: 'Failed to add participants', description: 'Please try again.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Conversation started!', description: `You can now chat with ${profileUser.name}` });
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
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


  if (!authUser) return null;
  
  if (loading) {
    return <ProfileLoadingSkeleton />;
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load profile"
        description={error}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  if (!profileUser) {
    return (
      <ErrorState 
        title="Profile not found"
        description="The profile you're looking for doesn't exist or has been removed."
        onRetry={() => navigate('/explore')}
        showRetry={true}
      />
    );
  }

  return (
    <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0">
      <div className="p-3 sm:p-4 md:p-8 max-w-6xl mx-auto">
        {/* Profile Header */}
        <ProfileHeader
          profileUser={profileUser}
          isOwnProfile={isOwnProfile}
          user={isOwnProfile ? currentUser : undefined}
          reactions={reactions}
          userReactions={userReactions}
          friendStatus={friendStatus}
          isUploading={isUploading}
          onAvatarUpload={handleAvatarUpload}
          onHeartReaction={handleHeartReaction}
          onFriendRequest={handleFriendRequest}
          onStartConversation={startConversation}
        />

        {/* Quick Stats */}
        <QuickStats
          stats={stats}
          isOwnProfile={isOwnProfile}
        />

        {/* Bio Section */}
        <ProfileBio
          profileUser={profileUser}
          culturalInterests={culturalInterests}
          lookingFor={lookingFor}
        />

        {/* Languages Section */}
        <div id="languages-section">
          <ProfileLanguages
            profileUser={profileUser}
            nativeLanguages={nativeLanguages}
            learningLanguages={learningLanguages}
          />
        </div>

        {/* Friends Section */}
        <div id="friends-section">
          <ProfileFriends
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            friendsCount={friendsCount}
          />
        </div>

        {/* Posts Section */}
        <div id="posts-section">
          <ProfilePosts
            userPosts={userPosts}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            user={isOwnProfile ? currentUser : undefined}
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
