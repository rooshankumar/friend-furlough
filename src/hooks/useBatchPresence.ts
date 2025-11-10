import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceMap {
  [userId: string]: {
    status: 'online' | 'away' | 'offline';
    last_seen: string;
    updated_at: string;
  };
}

/**
 * Hook to track presence for multiple users at once
 * Useful for user lists in Explore, Friends, etc.
 */
export function useBatchPresence(userIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const loadBatchPresence = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('user_presence')
          .select('*')
          .in('user_id', userIds);

        if (error) {
          console.error('Error loading batch presence:', error);
        } else if (data) {
          const map: PresenceMap = {};
          data.forEach((presence: any) => {
            map[presence.user_id] = presence;
          });
          setPresenceMap(map);
        }
      } catch (error) {
        console.error('Error loading batch presence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const subscribeToPresence = () => {
      channel = supabase
        .channel('batch-presence')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
            filter: `user_id=in.(${userIds.join(',')})`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setPresenceMap(prev => ({
                ...prev,
                [payload.new.user_id]: payload.new
              }));
            } else if (payload.eventType === 'DELETE') {
              setPresenceMap(prev => {
                const newMap = { ...prev };
                delete newMap[payload.old.user_id];
                return newMap;
              });
            }
          }
        )
        .subscribe();
    };

    loadBatchPresence();
    subscribeToPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userIds.join(',')]); // Only re-subscribe if user IDs change

  // Helper function to check if user is online
  const isUserOnline = (userId: string): boolean => {
    const presence = presenceMap[userId];
    if (!presence) return false;

    const now = new Date();
    const lastUpdate = new Date(presence.updated_at);
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    // Online if updated within last 5 minutes and status is online
    return minutesSinceUpdate < 5 && presence.status === 'online';
  };

  return { presenceMap, isLoading, isUserOnline };
}
