import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectionManager } from '@/lib/connectionManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

/**
 * Global sync hook that handles auto-updates across all pages
 * Eliminates need for hard refreshes by syncing data when connection is restored
 */
export const useGlobalSync = () => {
  const queryClient = useQueryClient();
  const { user, initialize } = useAuthStore();
  const { loadConversations } = useChatStore();

  // Refresh all data when connection is restored
  const syncAllData = useCallback(async () => {
    if (!user) return;

    console.log('🔄 Global sync: Refreshing all data...');

    try {
      // 1. Invalidate all React Query caches to force fresh data
      await queryClient.invalidateQueries();
      
      // 2. Refresh user profile and auth state
      await initialize();
      
      // 3. Refresh chat conversations
      await loadConversations(user.id);
      
      // 4. Refresh any other global state
      await syncRealtimeSubscriptions();
      
      console.log('✅ Global sync completed');
    } catch (error) {
      console.error('❌ Global sync failed:', error);
    }
  }, [user, queryClient, initialize, loadConversations]);

  // Sync real-time subscriptions across all features
  const syncRealtimeSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      // Subscribe to profile changes
      const profileChannel = supabase
        .channel(`profile_changes_${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('👤 Profile updated:', payload);
            initialize();
          }
        )
        .subscribe();

      // Subscribe to new conversations
      const conversationsChannel = supabase
        .channel(`conversations_${user.id}`)
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('💬 New conversation:', payload);
            loadConversations(user.id);
          }
        )
        .subscribe();

      // Subscribe to community posts updates
      const postsChannel = supabase
        .channel(`posts_updates_${user.id}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          (payload) => {
            console.log('📝 Posts updated:', payload);
            // Invalidate posts queries
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['community'] });
          }
        )
        .subscribe();

      // Subscribe to friend requests/connections
      const friendsChannel = supabase
        .channel(`friends_${user.id}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            console.log('👥 Friend request update:', payload);
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();

      console.log('✅ Real-time subscriptions established');
      
      // Store channels for cleanup
      (window as any).globalChannels = {
        profile: profileChannel,
        conversations: conversationsChannel,
        posts: postsChannel,
        friends: friendsChannel
      };

    } catch (error) {
      console.error('❌ Failed to setup real-time subscriptions:', error);
    }
  }, [user, queryClient, initialize, loadConversations]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ Page visible: Checking for updates...');
      
      // Check how long the page was hidden
      const lastSync = localStorage.getItem('lastSyncTime');
      const now = Date.now();
      const timeSinceLastSync = lastSync ? now - parseInt(lastSync) : Infinity;
      
      // If page was hidden for more than 30 seconds, sync all data
      if (timeSinceLastSync > 30000) {
        console.log('🔄 Page was hidden for', Math.round(timeSinceLastSync / 1000), 'seconds, syncing...');
        setTimeout(syncAllData, 500);
      }
      
      localStorage.setItem('lastSyncTime', now.toString());
    }
  }, [syncAllData]);

  // Handle connection restoration
  useEffect(() => {
    const unsubscribe = connectionManager.onConnectionChange(async (isOnline) => {
      if (isOnline) {
        console.log('🌐 Connection restored: Syncing all data...');
        // Wait a bit for connection to stabilize
        setTimeout(syncAllData, 1000);
      }
    });

    return unsubscribe;
  }, [syncAllData]);

  // Handle Supabase reconnection
  useEffect(() => {
    const handleSupabaseReconnect = () => {
      console.log('🔄 Supabase reconnected: Re-establishing subscriptions...');
      setTimeout(syncRealtimeSubscriptions, 1500);
    };

    window.addEventListener('supabase-reconnected', handleSupabaseReconnect);
    return () => window.removeEventListener('supabase-reconnected', handleSupabaseReconnect);
  }, [syncRealtimeSubscriptions]);

  // Handle page visibility changes
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Initial setup
  useEffect(() => {
    if (user) {
      syncRealtimeSubscriptions();
      localStorage.setItem('lastSyncTime', Date.now().toString());
    }

    // Cleanup on unmount
    return () => {
      const channels = (window as any).globalChannels;
      if (channels) {
        Object.values(channels).forEach((channel: any) => {
          if (channel && typeof channel.unsubscribe === 'function') {
            channel.unsubscribe();
          }
        });
        delete (window as any).globalChannels;
      }
    };
  }, [user, syncRealtimeSubscriptions]);

  return {
    syncAllData,
    syncRealtimeSubscriptions
  };
};
