import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { 
  preloadOfflineData, 
  hasOfflineData, 
  isPreloadStale,
  getLastPreloadTime 
} from '@/lib/offlineCache';

/**
 * Hook to automatically sync data for offline access
 * Preloads essential data when user logs in or when data is stale
 */
export function useOfflineSync() {
  const { user } = useAuthStore();
  const [isPreloading, setIsPreloading] = useState(false);
  const [hasCache, setHasCache] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  // Check cache status on mount
  useEffect(() => {
    const checkCache = async () => {
      const hasCachedData = await hasOfflineData();
      setHasCache(hasCachedData);
      
      const lastPreload = await getLastPreloadTime();
      setLastSync(lastPreload);
    };
    
    checkCache();
  }, []);

  // Auto-preload when user logs in or cache is stale
  useEffect(() => {
    if (!user?.id) return;

    // TEMPORARILY DISABLED - IndexedDB structure needs fixing
    // const autoPreload = async () => {
    //   try {
    //     const isStale = await isPreloadStale();
        
    //     // Preload if no cache or cache is stale
    //     if (!hasCache || isStale) {
    //       console.log('🔄 Auto-preloading offline data...');
    //       setIsPreloading(true);
          
    //       await preloadOfflineData(user.id);
          
    //       setHasCache(true);
    //       setLastSync(Date.now());
    //       setIsPreloading(false);
          
    //       console.log('✅ Auto-preload complete');
    //     }
    //   } catch (error) {
    //     console.error('❌ Auto-preload failed:', error);
    //     setIsPreloading(false);
    //   }
    // };

    // // Delay preload slightly to not block initial render
    // const timeout = setTimeout(autoPreload, 2000);
    
    // return () => clearTimeout(timeout);
  }, [user?.id, hasCache]);

  // Manual sync function
  const syncNow = async () => {
    if (!user?.id || isPreloading) return;
    
    try {
      console.log('🔄 Manual sync started...');
      setIsPreloading(true);
      
      await preloadOfflineData(user.id);
      
      setHasCache(true);
      setLastSync(Date.now());
      setIsPreloading(false);
      
      console.log('✅ Manual sync complete');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setIsPreloading(false);
    }
  };

  return {
    isPreloading,
    hasCache,
    lastSync,
    syncNow
  };
}
