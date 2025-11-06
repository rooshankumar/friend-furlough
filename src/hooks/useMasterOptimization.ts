import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { connectionManager } from '@/lib/connectionManager';

/**
 * MASTER OPTIMIZATION HOOK
 * Consolidates all performance optimizations in one place
 * Replaces: useAppOptimization, useMobileOptimization, usePageOptimization
 */
export const useMasterOptimization = () => {
  const queryClient = useQueryClient();
  const { user, initialize } = useAuthStore();
  const { loadConversations } = useChatStore();

  // Device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = (navigator as any).deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;

  // Configure React Query defaults (optimized for speed)
  useEffect(() => {
    console.log('🚀 Master optimization initialized');
    
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 2 * 60 * 1000, // 2min (reduced)
        gcTime: 5 * 60 * 1000, // 5min (reduced)
        retry: 1, // Only retry once
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0, // No retry for mutations
      }
    });
  }, [queryClient]);

  // Global data sync on reconnection
  const syncAllData = useCallback(async () => {
    if (!user) return;

    console.log('🔄 Syncing all data...');
    try {
      await queryClient.invalidateQueries();
      await initialize();
      await loadConversations(user.id);
      console.log('✅ Sync complete');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }, [user, queryClient, initialize, loadConversations]);

  // Setup real-time subscriptions (optimized - only critical ones)
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    console.log('📡 Setting up real-time subscriptions');

    // Only subscribe to profile changes (most critical)
    const profileChannel = supabase
      .channel(`profile_${user.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
        () => {
          console.log('👤 Profile updated');
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          initialize();
        }
      )
      .subscribe();

    // New conversations only (not all changes)
    const conversationsChannel = supabase
      .channel(`conversations_${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('💬 New conversation');
          loadConversations(user.id);
        }
      )
      .subscribe();

    // Removed posts subscription - pages will handle their own

    // Cleanup
    return () => {
      profileChannel.unsubscribe();
      conversationsChannel.unsubscribe();
    };
  }, [user, queryClient, initialize, loadConversations]);

  // Connection restoration handler
  useEffect(() => {
    const unsubscribe = connectionManager.onConnectionChange((isOnline) => {
      if (isOnline) {
        console.log('🌐 Connection restored');
        setTimeout(syncAllData, 1000);
      }
    });
    return unsubscribe;
  }, [syncAllData]);

  // Page visibility handler (optimized - longer threshold)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastSync = localStorage.getItem('lastSyncTime');
        const timeSinceSync = lastSync ? Date.now() - parseInt(lastSync) : Infinity;
        
        if (timeSinceSync > 5 * 60 * 1000) { // 5 minutes (increased from 1)
          console.log('👁️ Page visible after', Math.round(timeSinceSync / 1000), 's');
          setTimeout(syncAllData, 500);
        }
        localStorage.setItem('lastSyncTime', Date.now().toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncAllData]);

  // Image optimization
  useEffect(() => {
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.loading) img.loading = 'lazy';
        img.onerror = () => { img.src = '/placeholder-user.jpg'; };
      });
    };

    optimizeImages();
    const observer = new MutationObserver(optimizeImages);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Service worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('✅ Service Worker registered'))
        .catch((error) => console.error('Service Worker failed:', error));
    }
  }, []);

  // Setup subscriptions
  useEffect(() => {
    if (!user) return;
    const cleanup = setupRealtimeSubscriptions();
    localStorage.setItem('lastSyncTime', Date.now().toString());
    return cleanup;
  }, [user, setupRealtimeSubscriptions]);

  return {
    isMobile,
    isLowEndDevice,
    syncAllData,
  };
};
