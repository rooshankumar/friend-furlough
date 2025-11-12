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

  // Check if running on mobile
  const isMobile = Capacitor.isNativePlatform();

  // Sync general data (conversations, notifications)
  const syncGeneralData = useCallback(async () => {
    if (!user?.id || !isOnline || !isAuthenticated) return;

    try {
      console.log('🔄 Background sync: General data');
      await Promise.all([
        loadConversations(user.id),
        loadNotifications(user.id),
      ]);
    } catch (error) {
      console.error('❌ Background sync error (general):', error);
    }
  }, [user?.id, isOnline, isAuthenticated, loadConversations, loadNotifications]);

  // Sync messages (faster for real-time chat)
  const syncMessages = useCallback(async () => {
    if (!user?.id || !isOnline || !isAuthenticated) return;

    try {
      console.log('💬 Background sync: Messages');
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
      return;
    }

    // Clear existing timers
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    if (messageSyncTimerRef.current) {
      clearInterval(messageSyncTimerRef.current);
    }

    // Initial sync
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
      }
      if (messageSyncTimerRef.current) {
        clearInterval(messageSyncTimerRef.current);
      }
    };
  }, [enabled, isAuthenticated, user?.id, syncInterval, messageSyncInterval, syncGeneralData, syncMessages, isMobile]);

  // Pause sync when offline, resume when online
  useEffect(() => {
    if (isOnline && isAuthenticated && user?.id) {
      console.log('🌐 Connection restored - triggering sync');
      syncGeneralData();
      syncMessages();
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
    isSyncing: isOnline && isAuthenticated,
  };
};
