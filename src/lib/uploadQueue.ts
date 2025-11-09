/**
 * Upload Queue - Manages failed attachment uploads with retry capability
 * Uses IndexedDB for persistent storage across sessions
 */

export interface FailedUpload {
  id: string;
  conversationId: string;
  senderId: string;
  messageId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: Blob;
  timestamp: number;
  retryCount: number;
  lastError: string;
}

const DB_NAME = 'roshLingua-upload-queue';
const DB_VERSION = 1;
const STORE_NAME = 'failedUploads';
const MAX_RETRIES = 3;

let db: IDBDatabase | null = null;

/**
 * Initialize the upload queue database
 */
export async function initUploadQueue(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to initialize upload queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ Upload queue database initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-conversation', 'conversationId', { unique: false });
        store.createIndex('by-timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Add failed upload to queue
 */
export async function addToQueue(
  conversationId: string,
  senderId: string,
  file: File,
  error: string,
  messageId?: string
): Promise<string> {
  const database = await initUploadQueue();
  
  // Convert file to blob for storage
  const fileData = new Blob([await file.arrayBuffer()], { type: file.type });
  
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const failedUpload: FailedUpload = {
    id: uploadId,
    conversationId,
    senderId,
    messageId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileData,
    timestamp: Date.now(),
    retryCount: 0,
    lastError: error
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(failedUpload);

    request.onsuccess = () => {
      console.log('📥 Added failed upload to queue:', uploadId);
      resolve(uploadId);
    };

    request.onerror = () => {
      console.error('❌ Failed to add upload to queue:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all failed uploads from queue
 */
export async function getQueuedUploads(): Promise<FailedUpload[]> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const uploads = request.result as FailedUpload[];
      // Sort by timestamp (oldest first)
      resolve(uploads.sort((a, b) => a.timestamp - b.timestamp));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get failed uploads for a specific conversation
 */
export async function getConversationQueuedUploads(conversationId: string): Promise<FailedUpload[]> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-conversation');
    const request = index.getAll(conversationId);

    request.onsuccess = () => {
      resolve(request.result as FailedUpload[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get a specific failed upload
 */
export async function getQueuedUpload(uploadId: string): Promise<FailedUpload | undefined> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(uploadId);

    request.onsuccess = () => {
      resolve(request.result as FailedUpload | undefined);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Update retry count and error for failed upload
 */
export async function updateUploadRetry(
  uploadId: string,
  error: string
): Promise<void> {
  const database = await initUploadQueue();
  
  return new Promise(async (resolve, reject) => {
    try {
      const upload = await getQueuedUpload(uploadId);
      
      if (!upload) {
        console.warn('⚠️ Upload not found in queue:', uploadId);
        resolve();
        return;
      }
      
      upload.retryCount += 1;
      upload.lastError = error;
      
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(upload);

      request.onsuccess = () => {
        console.log(`🔄 Updated retry count for upload ${uploadId}: ${upload.retryCount}/${MAX_RETRIES}`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Remove upload from queue
 */
export async function removeFromQueue(uploadId: string): Promise<void> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(uploadId);

    request.onsuccess = () => {
      console.log('✅ Removed upload from queue:', uploadId);
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Clear all uploads from queue
 */
export async function clearQueue(): Promise<void> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('🗑️ Cleared all uploads from queue');
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get count of failed uploads
 */
export async function getQueueCount(): Promise<number> {
  const database = await initUploadQueue();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Check if upload should be retried
 */
export function shouldRetry(upload: FailedUpload): boolean {
  return upload.retryCount < MAX_RETRIES;
}

/**
 * Convert stored blob back to File
 */
export function blobToFile(upload: FailedUpload): File {
  return new File([upload.fileData], upload.fileName, { type: upload.fileType });
}

/**
 * Get retry-able uploads (haven't exceeded max retries)
 */
export async function getRetryableUploads(): Promise<FailedUpload[]> {
  const uploads = await getQueuedUploads();
  return uploads.filter(shouldRetry);
}

/**
 * Clean up old failed uploads (>7 days)
 */
export async function cleanupOldUploads(): Promise<number> {
  const uploads = await getQueuedUploads();
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const oldUploads = uploads.filter(upload => upload.timestamp < sevenDaysAgo);
  
  for (const upload of oldUploads) {
    await removeFromQueue(upload.id);
  }
  
  if (oldUploads.length > 0) {
    console.log(`🧹 Cleaned up ${oldUploads.length} old uploads`);
  }
  
  return oldUploads.length;
}

/**
 * Initialize queue and perform cleanup on app start
 */
export async function initAndCleanupQueue(): Promise<void> {
  await initUploadQueue();
  await cleanupOldUploads();
  
  const count = await getQueueCount();
  if (count > 0) {
    console.log(`📊 Upload queue initialized with ${count} pending uploads`);
  }
}
