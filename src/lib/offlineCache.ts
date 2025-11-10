/**
 * Offline Cache Manager
 * 
 * Preloads essential data for offline access (Facebook-style)
 * Users can browse cached content even without internet
 */

import { supabase } from '@/integrations/supabase/client';

const CACHE_VERSION = 'v1';
const OFFLINE_CACHE_NAME = `roshlingua-offline-${CACHE_VERSION}`;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache essential data to IndexedDB for offline access
 */
export class OfflineDataCache {
  private dbName = 'roshlingua-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save data to cache
   */
  async set(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      };

      const request = store.put(cachedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from cache
   */
  async get(storeName: string, id: string): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const cached = request.result as CachedData;
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > cached.expiresAt) {
          resolve(null);
          return;
        }

        resolve(cached.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from a store
   */
  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedData[];
        const now = Date.now();
        
        // Filter out expired items and extract data
        const validData = results
          .filter(item => now <= item.expiresAt)
          .map(item => item.data);
        
        resolve(validData);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    const stores = ['profiles', 'posts', 'conversations', 'messages', 'notifications', 'metadata'];
    
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Singleton instance
export const offlineCache = new OfflineDataCache();

/**
 * Preload essential data for offline access
 */
export async function preloadOfflineData(userId: string): Promise<void> {
  try {
    console.log('📦 Preloading data for offline access...');

    // Validate userId
    if (!userId) {
      console.log('⚠️ No user ID provided, skipping offline preload');
      return;
    }

    await offlineCache.init();

    // Preload user profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.warn('⚠️ Could not fetch profile:', profileError.message);
      } else if (profile && profile.id) {
        await offlineCache.set('profiles', profile);
        console.log('✅ Profile cached');
      }
    } catch (error) {
      console.warn('⚠️ Error caching profile:', error);
    }

    // Preload recent conversations (last 20)
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            profiles(*)
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (convError) {
        console.warn('⚠️ Could not fetch conversations:', convError.message);
      } else if (conversations) {
        for (const conv of conversations) {
          if (conv && conv.id) {
            await offlineCache.set('conversations', conv);
          }
        }
        console.log(`✅ ${conversations.length} conversations cached`);

        // Preload recent messages from each conversation
        for (const conv of conversations) {
          try {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(50);

            if (messages) {
              for (const msg of messages) {
                if (msg && msg.id) {
                  await offlineCache.set('messages', msg);
                }
              }
            }
          } catch (msgError) {
            console.warn(`⚠️ Could not fetch messages for conversation ${conv.id}`);
          }
        }
        console.log('✅ Recent messages cached');
      }
    } catch (error) {
      console.warn('⚠️ Error caching conversations:', error);
    }

    // Preload recent community posts (last 30)
    try {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*)
        `)
        .order('created_at', { ascending: false})
        .limit(30);

      if (postsError) {
        console.warn('⚠️ Could not fetch posts:', postsError.message);
      } else if (posts) {
        for (const post of posts) {
          if (post && post.id) {
            await offlineCache.set('posts', post);
          }
        }
        console.log(`✅ ${posts.length} posts cached`);
      }
    } catch (error) {
      console.warn('⚠️ Error caching posts:', error);
    }

    // Preload recent notifications (last 50)
    try {
      const { data: notifications, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifsError) {
        console.warn('⚠️ Could not fetch notifications:', notifsError.message);
      } else if (notifications) {
        for (const notif of notifications) {
          if (notif && notif.id) {
            await offlineCache.set('notifications', notif);
          }
        }
        console.log(`✅ ${notifications.length} notifications cached`);
      }
    } catch (error) {
      console.warn('⚠️ Error caching notifications:', error);
    }

    // Save metadata
    try {
      await offlineCache.set('metadata', {
        key: 'lastPreload',
        timestamp: Date.now(),
        userId
      });
    } catch (error) {
      console.warn('⚠️ Could not save metadata');
    }

    console.log('✅ Offline data preload complete!');
    console.log('📱 App is now ready for offline use');

  } catch (error) {
    console.error('❌ Error preloading offline data:', error);
  }
}

/**
 * Get cached data with fallback to network
 */
export async function getCachedOrFetch<T>(
  storeName: string,
  id: string,
  fetchFn: () => Promise<T>
): Promise<T | null> {
  try {
    // Try cache first
    const cached = await offlineCache.get(storeName, id);
    if (cached) {
      console.log(`📦 Using cached ${storeName}:${id}`);
      return cached;
    }

    // Fallback to network
    console.log(`🌐 Fetching fresh ${storeName}:${id}`);
    const fresh = await fetchFn();
    
    // Cache the fresh data
    if (fresh) {
      await offlineCache.set(storeName, { id, ...fresh });
    }
    
    return fresh;
  } catch (error) {
    console.error(`❌ Error getting ${storeName}:${id}`, error);
    
    // If network fails, try cache as last resort
    const cached = await offlineCache.get(storeName, id);
    return cached || null;
  }
}

/**
 * Check if offline data is available
 */
export async function hasOfflineData(): Promise<boolean> {
  try {
    await offlineCache.init();
    const metadata = await offlineCache.get('metadata', 'lastPreload');
    return !!metadata;
  } catch {
    return false;
  }
}

/**
 * Get last preload timestamp
 */
export async function getLastPreloadTime(): Promise<number | null> {
  try {
    await offlineCache.init();
    const metadata = await offlineCache.get('metadata', 'lastPreload');
    return metadata?.timestamp || null;
  } catch {
    return null;
  }
}

/**
 * Check if preload is stale (older than 24 hours)
 */
export async function isPreloadStale(): Promise<boolean> {
  const lastPreload = await getLastPreloadTime();
  if (!lastPreload) return true;
  
  const hoursSincePreload = (Date.now() - lastPreload) / (1000 * 60 * 60);
  return hoursSincePreload > 24;
}
