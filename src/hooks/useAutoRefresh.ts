import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { globalDataManager } from '@/lib/globalDataManager';

/**
 * Hook for pages to register for automatic data refresh
 * Eliminates need for hard refreshes by keeping page data in sync
 */
export const useAutoRefresh = (
  pageKey: string,
  refreshFunction?: () => Promise<void>,
  queryKeys?: string[]
) => {
  const queryClient = useQueryClient();

  // Default refresh function that invalidates React Query caches
  const defaultRefresh = useCallback(async () => {
    if (queryKeys && queryKeys.length > 0) {
      // Invalidate specific query keys
      for (const key of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }
      console.log(`🔄 Invalidated queries for ${pageKey}:`, queryKeys);
    } else {
      // Invalidate all queries as fallback
      await queryClient.invalidateQueries();
      console.log(`🔄 Invalidated all queries for ${pageKey}`);
    }
  }, [queryClient, queryKeys, pageKey]);

  // Use provided refresh function or default
  const refresh = refreshFunction || defaultRefresh;

  // Register refresh callback on mount
  useEffect(() => {
    globalDataManager.registerRefreshCallback(pageKey, refresh);

    return () => {
      globalDataManager.unregisterRefreshCallback(pageKey);
    };
  }, [pageKey, refresh]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    return globalDataManager.refreshData(pageKey);
  }, [pageKey]);

  // Refresh all data function
  const refreshAll = useCallback(() => {
    return globalDataManager.refreshAllData('manual');
  }, []);

  return {
    manualRefresh,
    refreshAll
  };
};

/**
 * Specific hooks for different page types
 */

// Hook for Community/Explore pages
export const useCommunityAutoRefresh = () => {
  return useAutoRefresh('community', undefined, ['posts', 'community', 'explore']);
};

// Hook for Profile pages
export const useProfileAutoRefresh = () => {
  return useAutoRefresh('profile', undefined, ['profile', 'user']);
};

// Hook for Chat pages
export const useChatAutoRefresh = () => {
  return useAutoRefresh('chat', undefined, ['conversations', 'messages', 'chat']);
};

// Hook for Friends pages
export const useFriendsAutoRefresh = () => {
  return useAutoRefresh('friends', undefined, ['friends', 'friend_requests', 'connections']);
};

// Hook for Events pages
export const useEventsAutoRefresh = () => {
  return useAutoRefresh('events', undefined, ['events', 'event_participants']);
};

// Hook for Notifications
export const useNotificationsAutoRefresh = () => {
  return useAutoRefresh('notifications', undefined, ['notifications', 'unread_count']);
};
