/**
 * Clear Service Worker Cache
 * 
 * Use this to force mobile browsers to reload fresh code
 * when you encounter stale cached versions
 */

export async function clearServiceWorkerCache(): Promise<void> {
  try {
    console.log('🧹 Clearing service worker cache...');
    
    // 1. Clear all caches
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
    
    // 3. Clear localStorage (optional - preserves auth)
    // localStorage.clear();
    
    console.log('✅ Cache cleared successfully!');
    console.log('🔄 Please reload the page to get fresh code');
    
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
 * Get cache info for debugging
 */
export async function getCacheInfo(): Promise<{
  cacheNames: string[];
  serviceWorkers: number;
  isActive: boolean;
}> {
  const cacheNames = 'caches' in window ? await caches.keys() : [];
  const registrations = 'serviceWorker' in navigator 
    ? await navigator.serviceWorker.getRegistrations() 
    : [];
  
  return {
    cacheNames,
    serviceWorkers: registrations.length,
    isActive: isServiceWorkerActive()
  };
}
