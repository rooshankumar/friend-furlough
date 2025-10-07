import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface FriendRequestState {
  friendRequestStatus: { [key: string]: string };
  areFriends: { [key: string]: boolean };
  isLoading: boolean;
  
  // Actions
  sendFriendRequest: (receiverId: string) => Promise<boolean>;
  unsendFriendRequest: (receiverId: string) => Promise<boolean>;
  checkFriendStatus: (otherUserId: string) => Promise<string>;
  checkAreFriends: (otherUserId: string) => Promise<boolean>;
  updateFriendStatus: (userId: string, status: string) => void;
}

export const useFriendRequestStore = create<FriendRequestState>((set, get) => ({
  friendRequestStatus: {},
  areFriends: {},
  isLoading: false,

  sendFriendRequest: async (receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // First check if request already exists
      const { data: existing } = await (supabase as any)
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .single();

      if (existing) {
        console.log('Friend request already exists:', existing);
        // Update local state with existing status
        set(state => ({
          friendRequestStatus: {
            ...state.friendRequestStatus,
            [receiverId]: existing.status
          }
        }));
        return false; // Don't send duplicate
      }

      // Insert new friend request
      const { error } = await (supabase as any)
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      // Update local state
      set(state => ({
        friendRequestStatus: {
          ...state.friendRequestStatus,
          [receiverId]: 'pending'
        }
      }));

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  },

  unsendFriendRequest: async (receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Delete the pending friend request
      const { error } = await (supabase as any)
        .from('friend_requests')
        .delete()
        .eq('sender_id', user.id)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error unsending friend request:', error);
        return false;
      }

      // Update local state
      set(state => ({
        friendRequestStatus: {
          ...state.friendRequestStatus,
          [receiverId]: 'none'
        }
      }));

      return true;
    } catch (error) {
      console.error('Error unsending friend request:', error);
      return false;
    }
  },

  checkFriendStatus: async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'none';

      // First check if they are already friends
      const userId1 = user.id < otherUserId ? user.id : otherUserId;
      const userId2 = user.id < otherUserId ? otherUserId : user.id;
      
      const { data: friendship } = await (supabase as any)
        .from('friendships')
        .select('id')
        .eq('user1_id', userId1)
        .eq('user2_id', userId2)
        .single();

      if (friendship) {
        set(state => ({
          friendRequestStatus: {
            ...state.friendRequestStatus,
            [otherUserId]: 'accepted'
          }
        }));
        return 'accepted';
      }

      // Check if there's a pending friend request
      const { data } = await (supabase as any)
        .from('friend_requests')
        .select('status, sender_id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .single();

      let status = 'none';
      if (data) {
        if (data.status === 'pending') {
          // Check if current user sent the request or received it
          status = data.sender_id === user.id ? 'pending' : 'received';
        } else {
          status = data.status;
        }
      }
      
      // Update local state
      set(state => ({
        friendRequestStatus: {
          ...state.friendRequestStatus,
          [otherUserId]: status
        }
      }));

      return status;
    } catch (error) {
      console.error('Error checking friend status:', error);
      return 'none';
    }
  },

  checkAreFriends: async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if friendship exists (order user IDs consistently)
      const userId1 = user.id < otherUserId ? user.id : otherUserId;
      const userId2 = user.id < otherUserId ? otherUserId : user.id;
      
      const { data } = await (supabase as any)
        .from('friendships')
        .select('id')
        .eq('user1_id', userId1)
        .eq('user2_id', userId2)
        .single();

      const friends = !!data;
      
      // Update local state
      set(state => ({
        areFriends: {
          ...state.areFriends,
          [otherUserId]: friends
        }
      }));

      return friends;
    } catch (error) {
      return false;
    }
  },

  updateFriendStatus: (userId: string, status: string) => {
    set(state => ({
      friendRequestStatus: {
        ...state.friendRequestStatus,
        [userId]: status
      }
    }));
  }
}));
