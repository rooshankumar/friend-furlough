/**
 * Local cache for attachments that have been uploaded to Cloudinary
 * but not yet saved to the database.
 * 
 * This ensures attachments persist across page refreshes until
 * they are successfully saved to the database.
 */

interface CachedAttachment {
  conversationId: string;
  senderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  clientId: string;
  messageType: 'image' | 'file';
  createdAt: string;
  retryCount: number;
}

const CACHE_KEY = 'pending_attachments';
const MAX_RETRY_COUNT = 3;

class AttachmentCache {
  /**
   * Add an attachment to the cache
   */
  add(attachment: Omit<CachedAttachment, 'retryCount'>): void {
    try {
      const cached = this.getAll();
      cached.push({ ...attachment, retryCount: 0 });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      console.log('📦 Cached attachment:', attachment.clientId);
    } catch (error) {
      console.error('Failed to cache attachment:', error);
    }
  }

  /**
   * Get all cached attachments
   */
  getAll(): CachedAttachment[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read attachment cache:', error);
      return [];
    }
  }

  /**
   * Get cached attachments for a specific conversation
   */
  getByConversation(conversationId: string): CachedAttachment[] {
    return this.getAll().filter(a => a.conversationId === conversationId);
  }

  /**
   * Remove an attachment from cache (after successful DB save)
   */
  remove(clientId: string): void {
    try {
      const cached = this.getAll();
      const filtered = cached.filter(a => a.clientId !== clientId);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      console.log('✅ Removed from cache:', clientId);
    } catch (error) {
      console.error('Failed to remove from cache:', error);
    }
  }

  /**
   * Increment retry count for an attachment
   */
  incrementRetry(clientId: string): void {
    try {
      const cached = this.getAll();
      const updated = cached.map(a => 
        a.clientId === clientId 
          ? { ...a, retryCount: a.retryCount + 1 }
          : a
      );
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to increment retry count:', error);
    }
  }

  /**
   * Get attachments that need retry (failed but under max retry count)
   */
  getRetryable(): CachedAttachment[] {
    return this.getAll().filter(a => a.retryCount < MAX_RETRY_COUNT);
  }

  /**
   * Clear all cached attachments (use with caution)
   */
  clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Cleared attachment cache');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Clear ALL localStorage data (complete reset)
   */
  clearAll(): void {
    try {
      localStorage.clear();
      console.log('🗑️ Cleared ALL localStorage data');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.getAll().length;
  }
}

export const attachmentCache = new AttachmentCache();
