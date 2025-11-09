/**
 * Message Queue for Mobile
 * 
 * When database inserts hang on mobile, queue messages locally
 * and sync them when the app regains focus or connection
 */

interface QueuedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  client_id: string;
  media_url?: string;
  created_at: string;
  retries: number;
}

const QUEUE_KEY = 'message_queue';
const MAX_RETRIES = 3;

export class MessageQueue {
  private queue: QueuedMessage[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];
      console.log(`📦 Loaded ${this.queue.length} queued messages`);
    } catch (error) {
      console.error('Failed to load message queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save message queue:', error);
    }
  }

  add(message: Omit<QueuedMessage, 'retries'>) {
    const queuedMessage: QueuedMessage = {
      ...message,
      retries: 0
    };
    
    this.queue.push(queuedMessage);
    this.saveQueue();
    console.log('✅ Message added to queue:', message.id);
  }

  remove(id: string) {
    this.queue = this.queue.filter(m => m.id !== id);
    this.saveQueue();
    console.log('✅ Message removed from queue:', id);
  }

  getAll(): QueuedMessage[] {
    return [...this.queue];
  }

  incrementRetry(id: string) {
    const message = this.queue.find(m => m.id === id);
    if (message) {
      message.retries++;
      this.saveQueue();
    }
  }

  shouldRetry(message: QueuedMessage): boolean {
    return message.retries < MAX_RETRIES;
  }

  clear() {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️ Message queue cleared');
  }

  size(): number {
    return this.queue.length;
  }
}

export const messageQueue = new MessageQueue();
