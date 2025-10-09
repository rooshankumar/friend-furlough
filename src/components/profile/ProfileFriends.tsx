import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from '@/components/UserAvatar';
import { CulturalBadge } from '@/components/CulturalBadge';
import { 
  Users, 
  UserPlus, 
  Bell,
  MessageCircle,
  Check,
  X,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';

interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    country?: string;
    country_flag?: string;
    city?: string;
    online?: boolean;
  };
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_profile?: {
    name: string;
    avatar_url?: string;
    country?: string;
    country_flag?: string;
  };
  receiver_profile?: {
    name: string;
    avatar_url?: string;
    country?: string;
    country_flag?: string;
  };
}

interface ProfileFriendsProps {
  profileUser: User;
  isOwnProfile: boolean;
  friendsCount: number;
}

export const ProfileFriends: React.FC<ProfileFriendsProps> = ({
  profileUser,
  isOwnProfile,
  friendsCount
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileUser?.id) {
      loadFriendsData();
    }
  }, [profileUser?.id]);

  const loadFriendsData = async () => {
    if (!profileUser?.id) return;
    
    setLoading(true);
    try {
      console.log('Loading friend data for user:', profileUser.id);
      
      // Load friend requests only for own profile
      let received = [];
      let sent = [];
      
      if (isOwnProfile && user?.id) {
        try {
          // Load received friend requests
          const { data: receivedData, error: receivedError } = await (supabase as any)
            .from('friend_requests')
            .select('*')
            .eq('receiver_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          console.log('Received requests:', receivedData, 'Error:', receivedError);
          
          if (!receivedError) {
            received = receivedData || [];
          }
        } catch (error) {
          console.error('friend_requests table may not exist:', error);
        }

        try {
          // Load sent friend requests
          const { data: sentData, error: sentError } = await (supabase as any)
            .from('friend_requests')
            .select('*')
            .eq('sender_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          console.log('Sent requests:', sentData, 'Error:', sentError);
          
          if (!sentError) {
            sent = sentData || [];
          }
        } catch (error) {
          console.error('Error loading sent requests:', error);
        }

        // Fetch profiles for received requests
        const receivedWithProfiles = [];
        for (const request of received) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, country, country_flag')
            .eq('id', request.sender_id)
            .single();
          
          receivedWithProfiles.push({
            ...request,
            sender_profile: profile
          });
        }

        // Fetch profiles for sent requests
        const sentWithProfiles = [];
        for (const request of sent) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, country, country_flag')
            .eq('id', request.receiver_id)
            .single();
          
          sentWithProfiles.push({
            ...request,
            receiver_profile: profile
          });
        }

        setReceivedRequests(receivedWithProfiles);
        setSentRequests(sentWithProfiles);
      }

      // Load friendships for the profile user
      let friendships = [];
      try {
        const { data: friendshipsData, error: friendshipsError } = await (supabase as any)
          .from('friendships')
          .select('*')
          .or(`user1_id.eq.${profileUser.id},user2_id.eq.${profileUser.id}`)
          .order('created_at', { ascending: false });
          
        console.log('Friendships:', friendshipsData, 'Error:', friendshipsError);
        
        if (!friendshipsError) {
          friendships = friendshipsData || [];
        }
      } catch (error) {
        console.error('Friendships table may not exist:', error);
      }

      // Process friendships to get friend profiles
      const processedFriends = [];
      for (const friendship of friendships || []) {
        // Determine which user is the friend (not the profile user)
        const friendId = friendship.user1_id === profileUser.id ? friendship.user2_id : friendship.user1_id;
        
        // Fetch the friend's profile
        const { data: friendProfile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, country, country_flag, city, online')
          .eq('id', friendId)
          .single();
        
        processedFriends.push({
          ...friendship,
          friend_profile: friendProfile
        });
      }

      setFriends(processedFriends);
    } catch (error) {
      console.error('Error loading friends data:', error);
      toast({
        title: "Error loading friends",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      const { error } = await (supabase as any)
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend request accepted!",
        description: `You and ${senderName} are now friends`,
      });

      loadFriendsData();
    } catch (error) {
      toast({
        title: "Failed to accept request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, senderName: string) => {
    try {
      const { error } = await (supabase as any)
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend request declined",
        description: `Request from ${senderName} has been declined`,
      });

      loadFriendsData();
    } catch (error) {
      toast({
        title: "Failed to decline request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const startChat = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || userId === user?.id) return;

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', userId)
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

      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: session.user.id },
          { conversation_id: conversation.id, user_id: userId }
        ]);

      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      toast({
        title: 'Failed to start conversation',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Don't render if no friends and not own profile
  if (friendsCount === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Friends & Connections</h3>
        </div>
        
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={loadFriendsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {isOwnProfile ? (
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="friends" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Requests ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">No friends yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Start connecting with people from around the world!
                </p>
                <Button onClick={() => navigate('/explore')} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.slice(0, 6).map((friendship) => (
                  <Card key={friendship.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div 
                            className="cursor-pointer"
                            onClick={() => navigate(`/profile/${friendship.friend_profile?.id}`)}
                          >
                            <UserAvatar 
                              profile={friendship.friend_profile}
                              className="w-12 h-12"
                            />
                          </div>
                          {friendship.friend_profile?.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-sm cursor-pointer hover:text-primary line-clamp-1"
                            onClick={() => {
                              console.log('Navigating to friend profile:', friendship.friend_profile?.id, 'Friend name:', friendship.friend_profile?.name);
                              navigate(`/profile/${friendship.friend_profile?.id}`);
                            }}
                          >
                            {friendship.friend_profile?.name}
                          </h4>
                          {friendship.friend_profile?.country && (
                            <div className="flex items-center gap-1 mt-1">
                              <CulturalBadge type="country" flag={friendship.friend_profile.country_flag || ''} className="text-xs">
                                {friendship.friend_profile.country}
                              </CulturalBadge>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Friends since {new Date(friendship.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => startChat(friendship.friend_profile?.id || '')}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {friends.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" onClick={() => navigate('/friends')}>
                  View All {friendsCount} Friends
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-0">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">No pending requests</h4>
                <p className="text-sm text-muted-foreground">
                  Friend requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="cursor-pointer"
                            onClick={() => navigate(`/profile/${request.sender_id}`)}
                          >
                            <UserAvatar 
                              profile={request.sender_profile}
                              className="w-10 h-10"
                            />
                          </div>
                          <div>
                            <h4 
                              className="font-medium text-sm cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/profile/${request.sender_id}`)}
                            >
                              {request.sender_profile?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {request.sender_profile?.country_flag} {request.sender_profile?.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, request.sender_profile?.name || '')}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectRequest(request.id, request.sender_profile?.name || '')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">No pending requests</h4>
                <p className="text-sm text-muted-foreground">
                  Requests you send will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="cursor-pointer"
                            onClick={() => navigate(`/profile/${request.receiver_id}`)}
                          >
                            <UserAvatar 
                              profile={request.receiver_profile}
                              className="w-10 h-10"
                            />
                          </div>
                          <div>
                            <h4 
                              className="font-medium text-sm cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/profile/${request.receiver_id}`)}
                            >
                              {request.receiver_profile?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {request.receiver_profile?.country_flag} {request.receiver_profile?.country}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // For other users' profiles - show friends only
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-medium mb-2">No friends yet</h4>
              <p className="text-sm text-muted-foreground">
                {profileUser.name} hasn't made any friends yet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {profileUser.name} has {friendsCount} friend{friendsCount !== 1 ? 's' : ''}
                </p>
                {friends.length > 6 && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/friends')}>
                    View All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {friends.slice(0, 6).map((friendship) => (
                  <Card key={friendship.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div 
                          className="cursor-pointer"
                          onClick={() => navigate(`/profile/${friendship.friend_profile?.id}`)}
                        >
                          <UserAvatar 
                            profile={friendship.friend_profile}
                            className="w-12 h-12"
                          />
                        </div>
                        <div>
                          <h4 
                            className="font-medium text-sm cursor-pointer hover:text-primary line-clamp-1"
                            onClick={() => navigate(`/profile/${friendship.friend_profile?.id}`)}
                          >
                            {friendship.friend_profile?.name}
                          </h4>
                          {friendship.friend_profile?.country && (
                            <p className="text-xs text-muted-foreground">
                              {friendship.friend_profile.country_flag} {friendship.friend_profile.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
