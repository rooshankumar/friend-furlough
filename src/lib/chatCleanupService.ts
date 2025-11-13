import { ConversationManager } from './conversationManager';

/**
 * Background service for cleaning up empty conversations
 * Runs periodically to remove conversations with no messages after 1 minute
 */
export class ChatCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the background cleanup service
   * Runs every 2 minutes to clean up empty conversations older than 1 minute
   */
  static start(userId: string): void {
    if (this.isRunning) {
      console.log('🧹 Chat cleanup service already running');
      return;
    }

    console.log('🧹 Starting chat cleanup service');
    this.isRunning = true;

    // Run cleanup immediately
    this.runCleanup(userId);

    // Set up periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.runCleanup(userId);
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Stop the background cleanup service
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🧹 Chat cleanup service stopped');
  }

  /**
   * Run a single cleanup cycle
   */
  private static async runCleanup(userId: string): Promise<void> {
    try {
      console.log('🧹 Running chat cleanup...');
      
      // Clean up empty conversations older than 1 minute
      await ConversationManager.cleanupEmptyConversations(userId, 1);
      
      // Also remove duplicates
      await ConversationManager.removeDuplicateConversations(userId);
      
      console.log('🧹 Chat cleanup completed');
    } catch (error) {
      console.error('❌ Chat cleanup failed:', error);
    }
  }

  /**
   * Manual cleanup trigger
   */
  static async runManualCleanup(userId: string): Promise<void> {
    await this.runCleanup(userId);
  }

  /**
   * Check if service is running
   */
  static isServiceRunning(): boolean {
    return this.isRunning;
  }
}
