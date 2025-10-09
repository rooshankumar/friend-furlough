// Lightweight IndexedDB outbox for persisting unsent chat messages
// Fallbacks to localStorage if IndexedDB is unavailable

export type OutboxItem = {
  client_id: string; // idempotency id
  tempId: string; // local temp id for optimistic message replacement
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  media_url?: string;
  created_at: string;
};

class OutboxDB {
  private db: IDBDatabase | null = null;
  private dbName = 'ff_chat';
  private storeName = 'outbox';

  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, falling back to localStorage for outbox');
      return;
    }
    if (this.db) return;

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'client_id' });
          store.createIndex('by_conversation', 'conversation_id', { unique: false });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private useLocalStorage(): boolean {
    return !this.db;
  }

  async put(item: OutboxItem): Promise<void> {
    if (this.useLocalStorage()) {
      const key = `outbox:${item.client_id}`;
      localStorage.setItem(key, JSON.stringify(item));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(this.storeName);
      store.put(item);
    });
  }

  async getAll(): Promise<OutboxItem[]> {
    if (this.useLocalStorage()) {
      const items: OutboxItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith('outbox:')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '');
            items.push(parsed);
          } catch {}
        }
      }
      return items;
    }
    return await new Promise<OutboxItem[]>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as OutboxItem[]);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(client_id: string): Promise<void> {
    if (this.useLocalStorage()) {
      localStorage.removeItem(`outbox:${client_id}`);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(this.storeName);
      store.delete(client_id);
    });
  }

  async clear(): Promise<void> {
    if (this.useLocalStorage()) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith('outbox:')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(this.storeName);
      store.clear();
    });
  }
}

export const outbox = new OutboxDB();
