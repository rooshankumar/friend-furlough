import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { supabaseWrapper } from '@/lib/connectionManager';

// Cache for preloaded data
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Helper to get cached data
const getCachedData = (key: string) => {
  const cached = dataCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    dataCache.delete(key);
    return null;
  }
  
  return cached.data;
};

// Helper to set cached data
const setCachedData = (key: string, data: any, ttl = 5 * 60 * 1000) => {
  dataCache.set(key, { data, timestamp: Date.now(), ttl });
};

// Preload conversations data
export const useConversationsPreloader = () => {
  const { user } = useAuthStore();
  const { loadConversations } = useChatStore();
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || preloadedRef.current) return;

    const preloadConversations = async () => {
      try {
        const cacheKey = `conversations_${user.id}`;
        const cached = getCachedData(cacheKey);
        
        if (cached) {
          console.log('📦 Using cached conversations data');
          return;
        }

        console.log('🚀 Preloading conversations...');
        await loadConversations(user.id);
        setCachedData(cacheKey, true);
        preloadedRef.current = true;
      } catch (error) {
        console.error('❌ Failed to preload conversations:', error);
      }
    };

    // Preload with a small delay to not block initial render
    const timeoutId = setTimeout(preloadConversations, 100);
    return () => clearTimeout(timeoutId);
  }, [user?.id, loadConversations]);
};

// Preload profile data
export const useProfilePreloader = (userId?: string) => {
  const preloadedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userId || preloadedRef.current.has(userId)) return;

    const preloadProfile = async () => {
      try {
        const cacheKey = `profile_${userId}`;
        const cached = getCachedData(cacheKey);
        
        if (cached) {
          console.log(`📦 Using cached profile data for ${userId}`);
          return;
        }

        console.log(`🚀 Preloading profile for ${userId}...`);
        
        // Preload profile data
        const profileResult = await Promise.resolve().then(async () => {
          const { fetchProfileById } = await import('@/integrations/supabase/fetchProfileById');
          return fetchProfileById(userId);
        }).catch((error) => {
          console.error('Failed to preload profile:', error);
          return null;
        });

        // Cache successful result
        if (profileResult) {
          setCachedData(`${cacheKey}_profile`, profileResult);
        }

        setCachedData(cacheKey, true);
        preloadedRef.current.add(userId);
      } catch (error) {
        console.error(`❌ Failed to preload profile for ${userId}:`, error);
      }
    };

    // Preload with a small delay
    const timeoutId = setTimeout(preloadProfile, 200);
    return () => clearTimeout(timeoutId);
  }, [userId]);

  // Return cached data getter
  return {
    getCachedProfile: () => getCachedData(`profile_${userId}_profile`),
    getCachedPosts: () => getCachedData(`profile_${userId}_posts`),
  };
};

// Preload community posts
export const useCommunityPreloader = () => {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (preloadedRef.current) return;

    const preloadCommunity = async () => {
      try {
        const cacheKey = 'community_posts';
        const cached = getCachedData(cacheKey);
        
        if (cached) {
          console.log('📦 Using cached community posts');
          return;
        }

        console.log('🚀 Preloading community posts...');
        
        const { supabase } = await import('@/integrations/supabase/client');
        const result = await supabaseWrapper.withRetry(async () => {
          return supabase
            .from('posts')
            .select(`
              id,
              content,
              image_url,
              user_id,
              profiles!inner (
                id,
                name,
                avatar_url,
                country_flag
              )
            `)
            .limit(20);
        }, 'preload community posts');

        setCachedData(cacheKey, result.data);
        preloadedRef.current = true;
      } catch (error) {
        console.error('❌ Failed to preload community posts:', error);
      }
    };

    // Preload with a delay
    const timeoutId = setTimeout(preloadCommunity, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  return {
    getCachedPosts: () => getCachedData('community_posts'),
  };
};

// Preload explore users
export const useExplorePreloader = () => {
  const { user } = useAuthStore();
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || preloadedRef.current) return;

    const preloadExplore = async () => {
      try {
        const cacheKey = `explore_users_${user.id}`;
        const cached = getCachedData(cacheKey);
        
        if (cached) {
          console.log('📦 Using cached explore users');
          return;
        }

        console.log('🚀 Preloading explore users...');
        
        const { supabase } = await import('@/integrations/supabase/client');
        const result = await supabaseWrapper.withRetry(async () => {
          return supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .eq('onboarding_completed', true)
            .order('created_at', { ascending: false })
            .limit(50);
        }, 'preload explore users');

        setCachedData(cacheKey, result.data);
        preloadedRef.current = true;
      } catch (error) {
        console.error('❌ Failed to preload explore users:', error);
      }
    };

    // Preload with a delay
    const timeoutId = setTimeout(preloadExplore, 400);
    return () => clearTimeout(timeoutId);
  }, [user?.id]);

  return {
    getCachedUsers: () => getCachedData(`explore_users_${user?.id}`),
  };
};

// Master preloader hook
export const useAppDataPreloader = () => {
  useConversationsPreloader();
  // Temporarily disable problematic preloaders to fix performance
  // useCommunityPreloader();
  // useExplorePreloader();
  
  // const { user } = useAuthStore();
  // useProfilePreloader(user?.id);
};

// Clear cache utility
export const clearDataCache = () => {
  dataCache.clear();
  console.log('🧹 Data cache cleared');
};
