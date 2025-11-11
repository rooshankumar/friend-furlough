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
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

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

  const handleCancelRequest = async (requestId: string, receiverName: string) => {
    setProcessingRequestId(requestId);
    try {
      // Optimistically remove from UI
      setSentRequests(prev => prev.filter(req => req.id !== requestId));

      const { error } = await (supabase as any)
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend request cancelled",
        description: `Request to ${receiverName} has been cancelled`,
      });

      // Reload to ensure consistency
      await loadFriendsData();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Failed to cancel request",
        description: "Please try again later",
        variant: "destructive",
      });
      // Reload on error to restore state
      await loadFriendsData();
    } finally {
      setProcessingRequestId(null);
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

      const { data: participants, error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: session.user.id },
          { conversation_id: conversation.id, user_id: userId }
        ])
        .select();

      if (participantError) throw participantError;

      // Verify participants were added
      const { data: verifyParticipants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation.id);

      console.log('✅ Participants verified:', verifyParticipants);

      // Reload conversations to get participant details before navigating
      const { loadConversations } = await import('@/stores/chatStore').then(m => m.useChatStore.getState());
      await loadConversations(session.user.id);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 300));

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
    <Card className="overflow-hidden border-border/50">
      {/* Header with Refresh */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Friends</h3>
        </div>
        
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
      </div>

      {/* Tabs for own profile */}
      {isOwnProfile ? (
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-4 md:m-5 mb-0">
            <TabsTrigger value="friends" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Friends
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {friends.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Requests
              {receivedRequests.length > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-primary">
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="mt-0 p-4 md:p-5">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">No friends yet</p>
                <Button onClick={() => navigate('/explore')} size="sm" className="h-8 text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Find Friends
                </Button>
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
                
                {friends.length > 12 && (
                  <div className="mt-4 pt-4 border-t border-border/50 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => navigate('/friends')}
                    >
                      View All Friends →
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Requests Tab with Nested Tabs */}
          <TabsContent value="requests" className="mt-0">
            {receivedRequests.length === 0 && sentRequests.length === 0 ? (
              <div className="text-center py-8 p-4 md:p-5">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium mb-1">No friend requests</p>
                <p className="text-xs text-muted-foreground">
                  Friend requests will appear here
                </p>
              </div>
            ) : (
              <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 m-4 md:m-5 mb-0">
                  <TabsTrigger value="received" className="text-xs">
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    Received
                    {receivedRequests.length > 0 && (
                      <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-primary">
                        {receivedRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="text-xs">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Sent
                    {sentRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                        {sentRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Received Requests Tab */}
                <TabsContent value="received" className="mt-0 p-4 md:p-5">
                  {receivedRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium mb-1">No incoming requests</p>
                      <p className="text-xs text-muted-foreground">
                        Friend requests you receive will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {receivedRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div 
                              className="cursor-pointer flex-shrink-0 group"
                              onClick={() => navigate(`/profile/${request.sender_id}`)}
                            >
                              <UserAvatar 
                                profile={request.sender_profile}
                                className="w-10 h-10 md:w-12 md:h-12 ring-2 ring-transparent group-hover:ring-primary transition-all"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="font-medium text-xs md:text-sm cursor-pointer hover:text-primary truncate"
                                onClick={() => navigate(`/profile/${request.sender_id}`)}
                              >
                                {request.sender_profile?.name}
                              </h4>
                              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {request.sender_profile?.country_flag} {request.sender_profile?.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            <Button 
                              size="sm"
                              className="h-7 px-2 md:h-8 md:px-3 text-[10px] md:text-xs"
                              onClick={() => handleAcceptRequest(request.id, request.sender_profile?.name || '')}
                              disabled={processingRequestId === request.id}
                            >
                              <Check className="h-3 w-3 md:mr-1" />
                              <span className="hidden md:inline">Accept</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-7 w-7 md:h-8 md:w-8 p-0"
                              onClick={() => handleRejectRequest(request.id, request.sender_profile?.name || '')}
                              disabled={processingRequestId === request.id}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sent Requests Tab */}
                <TabsContent value="sent" className="mt-0 p-4 md:p-5">
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium mb-1">No outgoing requests</p>
                      <p className="text-xs text-muted-foreground">
                        Friend requests you send will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div 
                              className="cursor-pointer flex-shrink-0 group"
                              onClick={() => navigate(`/profile/${request.receiver_id}`)}
                            >
                              <UserAvatar 
                                profile={request.receiver_profile}
                                className="w-10 h-10 md:w-12 md:h-12 ring-2 ring-transparent group-hover:ring-primary transition-all"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="font-medium text-xs md:text-sm cursor-pointer hover:text-primary truncate"
                                onClick={() => navigate(`/profile/${request.receiver_id}`)}
                              >
                                {request.receiver_profile?.name}
                              </h4>
                              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {request.receiver_profile?.country_flag} {request.receiver_profile?.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                              <span className="hidden sm:inline">Pending</span>
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleCancelRequest(request.id, request.receiver_profile?.name || '')}
                              disabled={processingRequestId === request.id}
                              title="Cancel request"
                            >
                              <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-own profile - just show friends */
        <div className="p-4 md:p-5">
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {profileUser.name} hasn't made any friends yet
              </p>
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
              
              {friends.length > 12 && (
                <div className="mt-4 pt-4 border-t border-border/50 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate('/friends')}
                  >
                    View All Friends →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};
