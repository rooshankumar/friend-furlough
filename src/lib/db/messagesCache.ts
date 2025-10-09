// Lightweight IndexedDB cache for recent chat messages per conversation
// Falls back to localStorage if IndexedDB is unavailable

export type StoredMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: string;
  media_url?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  client_id?: string;
  tempId?: string;
};

class MessagesCacheDB {
  private db: IDBDatabase | null = null;
  private dbName = 'ff_chat';
  private storeName = 'messages';

  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, messagesCache will use localStorage');
      return;
    }
    if (this.db) return;

    // First open without specifying version to get current version
    const initialDb: IDBDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // If store exists, keep this connection
    if (initialDb.objectStoreNames.contains(this.storeName)) {
      this.db = initialDb;
      return;
    }

    // Otherwise, upgrade DB version to create missing store
    const newVersion = (initialDb.version || 1) + 1;
    initialDb.close();
    await new Promise<void>((resolve, reject) => {
      const upgradeReq = indexedDB.open(this.dbName, newVersion);
      upgradeReq.onupgradeneeded = () => {
        const db = upgradeReq.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          try { store.createIndex('by_conversation', 'conversation_id', { unique: false }); } catch {}
          try { store.createIndex('by_conversation_created', ['conversation_id', 'created_at'], { unique: false }); } catch {}
        }
      };
      upgradeReq.onsuccess = () => { this.db = upgradeReq.result; resolve(); };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    });
  }

  private useLocal(): boolean { return !this.db; }

  async saveMessages(messages: StoredMessage[]): Promise<void> {
    if (!messages || messages.length === 0) return;
    if (this.useLocal()) {
      try {
        const key = `messagesCache:${messages[0].conversation_id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const map = new Map<string, StoredMessage>(existing.map((m: StoredMessage) => [m.id, m]));
        for (const m of messages) map.set(m.id, m);
        const merged = Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(-200);
        localStorage.setItem(key, JSON.stringify(merged));
      } catch {}
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(this.storeName);
      for (const m of messages) store.put(m);
    });
  }

  async saveMessage(message: StoredMessage): Promise<void> {
    return this.saveMessages([message]);
  }

  async getRecentMessages(conversationId: string, limit: number = 50): Promise<StoredMessage[]> {
    if (this.useLocal()) {
      const key = `messagesCache:${conversationId}`;
      const arr: StoredMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
      return arr.slice(-limit);
    }
    return await new Promise<StoredMessage[]>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const idx = store.index('by_conversation');
      const req = idx.getAll(IDBKeyRange.only(conversationId));
      req.onsuccess = () => {
        const items = (req.result as StoredMessage[])
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-limit);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const messagesCache = new MessagesCacheDB();
