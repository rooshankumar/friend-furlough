import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Bell,
  MessageCircle,
  Check,
  X,
  Clock,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';

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

interface Friendship {
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
    online?: boolean;
  };
}

const FriendsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all friend-related data
  useEffect(() => {
    if (!user?.id) return;
    loadFriendData();
  }, [user?.id]);

  // Also refresh when component mounts (for navigation from other pages)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.id) {
        loadFriendData();
      }
    }, 500); // Small delay to ensure proper loading

    return () => clearTimeout(timer);
  }, []);

  const loadFriendData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Loading friend data for user:', user.id);
      
      // Check if friend_requests table exists by trying a simple query
      let received = [];
      let sent = [];
      
      try {
        // Load received friend requests (simplified query)
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
        toast({
          title: "Database setup needed",
          description: "Please run the COMPLETE_PROFILE_UPDATE.sql script in Supabase",
          variant: "destructive",
        });
      }

      try {
        // Load sent friend requests (simplified query)
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

      // If we have sent requests, fetch the receiver profiles separately
      let sentWithProfiles = [];
      if (sent && sent.length > 0) {
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
      }

      // If we have received requests, fetch the sender profiles separately  
      let receivedWithProfiles = [];
      if (received && received.length > 0) {
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
      }

      // Load friendships (simplified - table may not exist yet)
      let friendships = [];
      try {
        const { data: friendshipsData, error: friendshipsError } = await (supabase as any)
          .from('friendships')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
          
        console.log('Friendships:', friendshipsData, 'Error:', friendshipsError);
        
        if (!friendshipsError) {
          friendships = friendshipsData || [];
        }
      } catch (error) {
        console.error('Friendships table may not exist:', error);
      }

      // Process friendships to get the friend's profile
      const processedFriends = (friendships || []).map((friendship: any) => {
        const friendProfile = friendship.user1_id === user.id 
          ? friendship.user2_profile 
          : friendship.user1_profile;
        
        return {
          ...friendship,
          friend_profile: friendProfile
        };
      });

      setReceivedRequests(receivedWithProfiles);
      setSentRequests(sentWithProfiles);
      setFriends(processedFriends);
    } catch (error) {
      console.error('Error loading friend data:', error);
      toast({
        title: "Error loading friends",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      // Reload data
      loadFriendData();
    } catch (error) {
      console.error('Error accepting request:', error);
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

      // Reload data
      loadFriendData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Failed to decline request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async (requestId: string, receiverName: string) => {
    try {
      console.log('Cancelling request:', requestId);
      
      const { error } = await (supabase as any)
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user?.id) // Ensure user can only cancel their own requests
        .eq('status', 'pending'); // Only cancel pending requests

      if (error) {
        console.error('Cancel error:', error);
        throw error;
      }

      toast({
        title: "Friend request cancelled",
        description: `Your request to ${receiverName} has been cancelled`,
      });

      // Reload data to refresh the UI
      await loadFriendData();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Failed to cancel request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const viewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const startChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadFriendData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">Manage your friend requests and connections</p>
        </div>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Requests ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Friends List */}
        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
              <p className="text-muted-foreground mb-4">
                Start connecting with people to build your network
              </p>
              <Button onClick={() => navigate('/explore')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friends.map((friendship) => (
                <Card key={friendship.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar 
                          className="h-12 w-12 cursor-pointer" 
                          onClick={() => viewProfile(friendship.friend_profile?.id || '')}
                        >
                          <AvatarImage src={friendship.friend_profile?.avatar_url} />
                          <AvatarFallback>
                            {friendship.friend_profile?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {friendship.friend_profile?.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <h3 
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => viewProfile(friendship.friend_profile?.id || '')}
                        >
                          {friendship.friend_profile?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {friendship.friend_profile?.country_flag} {friendship.friend_profile?.country}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Friends since {new Date(friendship.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startChat(friendship.friend_profile?.id || '')}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewProfile(friendship.friend_profile?.id || '')}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Received Requests */}
        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                You'll see friend requests here when people want to connect with you
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {receivedRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => viewProfile(request.sender_id)}
                      >
                        <AvatarImage src={request.sender_profile?.avatar_url} />
                        <AvatarFallback>
                          {request.sender_profile?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => viewProfile(request.sender_id)}
                        >
                          {request.sender_profile?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {request.sender_profile?.country_flag} {request.sender_profile?.country}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id, request.sender_profile?.name || '')}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRejectRequest(request.id, request.sender_profile?.name || '')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Requests */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                Friend requests you send will appear here
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => viewProfile(request.receiver_id)}
                      >
                        <AvatarImage src={request.receiver_profile?.avatar_url} />
                        <AvatarFallback>
                          {request.receiver_profile?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => viewProfile(request.receiver_id)}
                        >
                          {request.receiver_profile?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {request.receiver_profile?.country_flag} {request.receiver_profile?.country}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsPage;
