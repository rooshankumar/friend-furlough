import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  updated_at: string;
}

/**
 * Hook to track and subscribe to user presence status
 */
export function usePresence(userId: string | undefined) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const loadPresence = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('user_presence')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading presence:', error);
        } else if (data) {
          setPresence(data);
        }
      } catch (error) {
        console.error('Error loading presence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const subscribeToPresence = () => {
      channel = supabase
        .channel(`presence:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setPresence(payload.new as UserPresence);
            } else if (payload.eventType === 'DELETE') {
              setPresence(null);
            }
          }
        )
        .subscribe();
    };

    loadPresence();
    subscribeToPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { presence, isLoading };
}

/**
 * Hook to update current user's presence status
 */
export function useUpdatePresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    let heartbeatInterval: NodeJS.Timeout;

    const updatePresence = async (status: 'online' | 'away' | 'offline') => {
      try {
        await (supabase as any)
          .from('user_presence')
          .upsert({
            user_id: userId,
            status,
            last_seen: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Set online when component mounts
    updatePresence('online');

    // Send heartbeat every 2 minutes to stay online
    heartbeatInterval = setInterval(() => {
      updatePresence('online');
    }, 2 * 60 * 1000); // 2 minutes

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set offline when leaving
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, [userId]);
}

/**
 * Get user's online status with smart logic
 */
export function getOnlineStatus(presence: UserPresence | null): {
  isOnline: boolean;
  status: 'online' | 'away' | 'offline';
  lastSeen: string | null;
} {
  if (!presence) {
    return { isOnline: false, status: 'offline', lastSeen: null };
  }

  const now = new Date();
  const lastUpdate = new Date(presence.updated_at);
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

  // If updated within last 5 minutes, use the status
  if (minutesSinceUpdate < 5) {
    return {
      isOnline: presence.status === 'online',
      status: presence.status,
      lastSeen: presence.last_seen
    };
  }

  // Otherwise, mark as offline
  return {
    isOnline: false,
    status: 'offline',
    lastSeen: presence.last_seen
  };
}
