import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface BackgroundSyncOptions {
  enabled?: boolean;
  syncInterval?: number; // in milliseconds
  messageSyncInterval?: number; // faster sync for messages
}

/**
 * Background sync system for real-time updates
 * Automatically fetches latest data in the background
 * Optimized for mobile with faster message sync
 */
export const useBackgroundSync = (options: BackgroundSyncOptions = {}) => {
  const {
    enabled = true,
    syncInterval = 30000, // 30 seconds for general data
    messageSyncInterval = 5000, // 5 seconds for messages
  } = options;

  const { user, isAuthenticated } = useAuthStore();
  const { loadConversations, loadMessages, subscribeToMessages } = useChatStore();
  const { loadNotifications, subscribeToNotifications } = useNotificationStore();
  const isOnline = useConnectionStatus();

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAppActiveRef = useRef(true);
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef(false);

  // Check if running on mobile
  const isMobile = Capacitor.isNativePlatform();

  // Sync general data (conversations, notifications)
  const syncGeneralData = useCallback(async () => {
    if (!user?.id || !isOnline || !isAuthenticated || isSyncingRef.current) return;

    const now = Date.now();
    // Prevent too frequent syncs (minimum 10 seconds apart)
    if (now - lastSyncRef.current < 10000) return;

    try {
      isSyncingRef.current = true;
      lastSyncRef.current = now;
      
      // Only log every 5th sync to reduce spam
      if (Math.random() < 0.2) {
        console.log('🔄 Background sync: General data');
      }
      
      await Promise.all([
        loadConversations(user.id),
        loadNotifications(user.id),
      ]);
    } catch (error) {
      console.error('❌ Background sync error (general):', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.id, isOnline, isAuthenticated, loadConversations, loadNotifications]);

  // Sync messages (faster for real-time chat)
  const syncMessages = useCallback(async () => {
    if (!user?.id || !isOnline || !isAuthenticated || isSyncingRef.current) return;

    try {
      // Only log occasionally to reduce spam
      if (Math.random() < 0.1) {
        console.log('💬 Background sync: Messages');
      }
      
      // Only sync conversations to get latest message updates
      await loadConversations(user.id);
    } catch (error) {
      console.error('❌ Background sync error (messages):', error);
    }
  }, [user?.id, isOnline, isAuthenticated, loadConversations]);

  // Handle app state changes (mobile only)
  useEffect(() => {
    if (!isMobile) return;

    const handleAppStateChange = (state: { isActive: boolean }) => {
      isAppActiveRef.current = state.isActive;
      
      if (state.isActive) {
        console.log('📱 App became active - triggering sync');
        // Immediate sync when app becomes active
        syncGeneralData();
        syncMessages();
      }
    };

    App.addListener('appStateChange', handleAppStateChange);

    return () => {
      App.removeAllListeners();
    };
  }, [syncGeneralData, syncMessages, isMobile]);

  // Setup background sync intervals
  useEffect(() => {
    if (!enabled || !isAuthenticated || !user?.id) {
      // Clear any existing timers when disabled
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (messageSyncTimerRef.current) {
        clearInterval(messageSyncTimerRef.current);
        messageSyncTimerRef.current = null;
      }
      return;
    }

    // Prevent duplicate initialization
    if (syncTimerRef.current || messageSyncTimerRef.current) {
      return;
    }

    // Initial sync (only once)
    syncGeneralData();
    syncMessages();

    // Setup general data sync interval
    syncTimerRef.current = setInterval(() => {
      // Only sync when app is active (mobile) or always (web)
      if (!isMobile || isAppActiveRef.current) {
        syncGeneralData();
      }
    }, syncInterval);

    // Setup faster message sync interval
    messageSyncTimerRef.current = setInterval(() => {
      // Only sync when app is active (mobile) or always (web)
      if (!isMobile || isAppActiveRef.current) {
        syncMessages();
      }
    }, messageSyncInterval);

    console.log(`🔄 Background sync started - General: ${syncInterval}ms, Messages: ${messageSyncInterval}ms`);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (messageSyncTimerRef.current) {
        clearInterval(messageSyncTimerRef.current);
        messageSyncTimerRef.current = null;
      }
      console.log('🔄 Background sync stopped');
    };
  }, [enabled, isAuthenticated, user?.id]);

  // Track offline state to prevent excessive syncing
  const wasOfflineRef = useRef(false);
  
  // Pause sync when offline, resume when online (debounced)
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    
    // Only sync when coming back online AND user is authenticated
    if (isOnline && isAuthenticated && user?.id && wasOfflineRef.current) {
      const timer = setTimeout(() => {
        console.log('🌐 Connection restored - triggering sync');
        syncGeneralData();
        syncMessages();
        wasOfflineRef.current = false;
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [isOnline, isAuthenticated, user?.id, syncGeneralData, syncMessages]);

  // Manual sync function for external use
  const manualSync = useCallback(async () => {
    console.log('🔄 Manual sync triggered');
    await Promise.all([
      syncGeneralData(),
      syncMessages(),
    ]);
  }, [syncGeneralData, syncMessages]);

  return {
    manualSync,
    isEnabled: enabled && isAuthenticated && !!user?.id,
    isSyncing: isSyncingRef.current && isOnline && isAuthenticated,
  };
};
