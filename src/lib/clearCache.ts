/**
 * Clear Service Worker Cache & All Browser Storage
 * 
 * Use this to force mobile browsers to reload fresh code
 * when you encounter stale cached versions
 */

export async function clearServiceWorkerCache(): Promise<void> {
  try {
    console.log('🧹 Starting comprehensive cache clear...');
    
    // 1. Clear all caches (Service Worker caches)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('📦 Found caches:', cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      console.log('✅ All caches cleared');
    }
    
    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔧 Found service workers:', registrations.length);
      
      await Promise.all(
        registrations.map(registration => {
          console.log('🗑️ Unregistering service worker');
          return registration.unregister();
        })
      );
      
      console.log('✅ All service workers unregistered');
    }
    
    // 3. Clear IndexedDB databases
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        console.log('💾 Found IndexedDB databases:', databases.length);
        
        for (const db of databases) {
          if (db.name) {
            console.log('🗑️ Deleting database:', db.name);
            indexedDB.deleteDatabase(db.name);
          }
        }
        console.log('✅ IndexedDB cleared');
      } catch (error) {
        console.warn('⚠️ Could not clear IndexedDB:', error);
      }
    }
    
    // 4. Clear Session Storage
    try {
      sessionStorage.clear();
      console.log('✅ Session storage cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear session storage:', error);
    }
    
    // 5. Clear specific localStorage items (preserve auth tokens)
    try {
      const authKeys = ['supabase.auth.token', 'sb-access-token', 'sb-refresh-token'];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !authKeys.some(authKey => key.includes(authKey))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('✅ LocalStorage cleaned (auth preserved)');
    } catch (error) {
      console.warn('⚠️ Could not clean localStorage:', error);
    }
    
    console.log('✅ Cache cleared successfully!');
    console.log('🔄 Reloading to fetch fresh data...');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    throw error;
  }
}

/**
 * Force reload with cache bypass
 */
export function forceReload(): void {
  console.log('🔄 Force reloading page...');
  window.location.reload();
}

/**
 * Clear cache and reload
 */
export async function clearCacheAndReload(): Promise<void> {
  await clearServiceWorkerCache();
  setTimeout(() => {
    forceReload();
  }, 1000);
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}

/**
 * Get comprehensive cache info for debugging
 */
export async function getCacheInfo(): Promise<{
  cacheNames: string[];
  serviceWorkers: number;
  isActive: boolean;
  indexedDBs: number;
  localStorageSize: number;
  sessionStorageSize: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
}> {
  const cacheNames = 'caches' in window ? await caches.keys() : [];
  const registrations = 'serviceWorker' in navigator 
    ? await navigator.serviceWorker.getRegistrations() 
    : [];
  
  let indexedDBCount = 0;
  try {
    const databases = await indexedDB.databases();
    indexedDBCount = databases.length;
  } catch (error) {
    console.warn('Could not get IndexedDB info:', error);
  }
  
  const localStorageSize = localStorage.length;
  const sessionStorageSize = sessionStorage.length;
  
  // Calculate total cache size
  let totalSizeBytes = 0;
  
  // Estimate localStorage size
  let localStorageBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      localStorageBytes += key.length + (value?.length || 0);
    }
  }
  totalSizeBytes += localStorageBytes * 2; // UTF-16 encoding
  
  // Estimate sessionStorage size
  let sessionStorageBytes = 0;
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      const value = sessionStorage.getItem(key);
      sessionStorageBytes += key.length + (value?.length || 0);
    }
  }
  totalSizeBytes += sessionStorageBytes * 2; // UTF-16 encoding
  
  // Get Cache API size
  if ('caches' in window) {
    try {
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSizeBytes += blob.size;
          }
        }
      }
    } catch (error) {
      console.warn('Could not calculate cache size:', error);
    }
  }
  
  // Format size for display
  const totalSizeFormatted = formatBytes(totalSizeBytes);
  
  return {
    cacheNames,
    serviceWorkers: registrations.length,
    isActive: isServiceWorkerActive(),
    indexedDBs: indexedDBCount,
    localStorageSize,
    sessionStorageSize,
    totalSizeBytes,
    totalSizeFormatted
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Preload essential data for better UX (Facebook-style)
 * Call this after login or app initialization
 */
export async function preloadEssentialData(userId: string): Promise<void> {
  try {
    console.log('📦 Preloading essential data...');
    
    // This will be called by stores to preload data
    // The actual preloading is handled by individual stores
    // This function just triggers the preload process
    
    const preloadPromises = [
      // Trigger preload events
      new CustomEvent('preload:profile', { detail: { userId } }),
      new CustomEvent('preload:conversations', { detail: { userId } }),
      new CustomEvent('preload:notifications', { detail: { userId } })
    ];
    
    preloadPromises.forEach(event => window.dispatchEvent(event));
    
    console.log('✅ Preload triggered for essential data');
  } catch (error) {
    console.error('❌ Error preloading data:', error);
  }
}
