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
    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Friends</h3>
          <span className="text-xs text-muted-foreground">({friendsCount})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2"
              onClick={loadFriendsData}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {friends.length > 8 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/friends')}
            >
              View All →
            </Button>
          )}
        </div>
      </div>

      {/* Compact Horizontal Friends Row */}
      {friends.length === 0 ? (
        <div className="text-center py-6">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            {isOwnProfile ? 'No friends yet' : `${profileUser.name} hasn't made any friends yet`}
          </p>
          {isOwnProfile && (
            <Button onClick={() => navigate('/explore')} size="sm" className="h-7 text-xs">
              <UserPlus className="h-3 w-3 mr-1" />
              Find Friends
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Horizontal Scrolling Friends */}
          <div className="overflow-x-auto -mx-4 px-4 md:-mx-5 md:px-5">
            <div className="flex gap-3 pb-2">
              {friends.slice(0, 12).map((friendship) => (
                <div 
                  key={friendship.id}
                  className="flex-shrink-0 w-20 cursor-pointer group"
                  onClick={() => {
                    if (friendship.friend_profile?.id) {
                      navigate(`/profile/${friendship.friend_profile.id}`);
                    }
                  }}
                >
                  <div className="relative mb-2">
                    <UserAvatar 
                      profile={friendship.friend_profile}
                      className="w-16 h-16 mx-auto border-2 border-border group-hover:border-primary transition-colors"
                    />
                    {friendship.friend_profile?.online && (
                      <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <p className="text-xs text-center font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {friendship.friend_profile?.name}
                  </p>
                </div>
              ))}
              {friends.length > 12 && (
                <div 
                  className="flex-shrink-0 w-20 cursor-pointer group"
                  onClick={() => navigate('/friends')}
                >
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-dashed border-border group-hover:border-primary transition-colors flex items-center justify-center bg-muted/50">
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">+{friends.length - 12}</span>
                  </div>
                  <p className="text-xs text-center font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    View All
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Friend Requests Indicators (for own profile) */}
          {isOwnProfile && (receivedRequests.length > 0 || sentRequests.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-4 text-xs">
              {receivedRequests.length > 0 && (
                <button 
                  onClick={() => navigate('/friends')}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>{receivedRequests.length} new request{receivedRequests.length !== 1 ? 's' : ''}</span>
                </button>
              )}
              {sentRequests.length > 0 && (
                <button 
                  onClick={() => navigate('/friends')}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary hover:underline"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{sentRequests.length} pending</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Keep the tabs for own profile but make them collapsible */}
      {isOwnProfile && friends.length > 0 && (receivedRequests.length > 0 || sentRequests.length > 0) && (
        <Tabs defaultValue="friends" className="w-full mt-4 hidden">
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
            {/* Content moved to horizontal scroll above */}
          </TabsContent>

          <TabsContent value="received" className="mt-0 hidden">
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
                            onClick={() => {
                              if (request.sender_id) {
                                navigate(`/profile/${request.sender_id}`);
                              }
                            }}
                          >
                            <UserAvatar 
                              profile={request.sender_profile}
                              className="w-10 h-10"
                            />
                          </div>
                          <div>
                            <h4 
                              className="font-medium text-sm cursor-pointer hover:text-primary"
                              onClick={() => {
                                if (request.sender_id) {
                                  navigate(`/profile/${request.sender_id}`);
                                }
                              }}
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

          <TabsContent value="sent" className="mt-0 hidden">
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
                            onClick={() => {
                              if (request.receiver_id) {
                                navigate(`/profile/${request.receiver_id}`);
                              }
                            }}
                          >
                            <UserAvatar 
                              profile={request.receiver_profile}
                              className="w-10 h-10"
                            />
                          </div>
                          <div>
                            <h4 
                              className="font-medium text-sm cursor-pointer hover:text-primary"
                              onClick={() => {
                                if (request.receiver_id) {
                                  navigate(`/profile/${request.receiver_id}`);
                                }
                              }}
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
      )}
    </div>
  );
};
