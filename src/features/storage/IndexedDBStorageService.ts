/**
 * IndexedDB Storage Service for Offline Document Processing
 * Provides comprehensive offline storage with sync capabilities
 */

export interface OfflineDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalFile: ArrayBuffer;
  processedData?: {
    text?: string;
    metadata?: Record<string, any>;
    thumbnailUrl?: string;
  };
  status: 'pending' | 'processed' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  processing?: {
    progress: number;
    stage: string;
  };
}

export interface OfflineProcessingSession {
  id: string;
  documents: string[];
  status: 'active' | 'completed' | 'synced';
  createdAt: Date;
  completedAt?: Date;
  syncedAt?: Date;
  metadata?: Record<string, any>;
}

class IndexedDBStorageService {
  private dbName = 'DocumentProcessorDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentsStore.createIndex('status', 'status');
          documentsStore.createIndex('createdAt', 'createdAt');
          documentsStore.createIndex('fileType', 'fileType');
        }

        // Processing sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('status', 'status');
          sessionsStore.createIndex('createdAt', 'createdAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Processing queue store
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('priority', 'priority');
          queueStore.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.initialize();
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Document operations
  async storeDocument(file: File, processedData?: any): Promise<string> {
    const id = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    
    const document: OfflineDocument = {
      id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      originalFile: arrayBuffer,
      processedData,
      status: processedData ? 'processed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const store = await this.getStore('documents', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.add(document);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async updateDocument(id: string, updates: Partial<OfflineDocument>): Promise<void> {
    const store = await this.getStore('documents', 'readwrite');
    
    // Get existing document
    const getRequest = store.get(id);
    const existingDoc = await new Promise<OfflineDocument>((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!existingDoc) throw new Error('Document not found');

    // Update document
    const updatedDoc = {
      ...existingDoc,
      ...updates,
      updatedAt: new Date(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(updatedDoc);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDocument(id: string): Promise<OfflineDocument | null> {
    const store = await this.getStore('documents');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDocuments(filter?: {
    status?: OfflineDocument['status'];
    fileType?: string;
    limit?: number;
  }): Promise<OfflineDocument[]> {
    const store = await this.getStore('documents');
    
    return new Promise((resolve, reject) => {
      const documents: OfflineDocument[] = [];
      const request = filter?.status ? 
        store.index('status').openCursor(IDBKeyRange.only(filter.status)) :
        store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const doc = cursor.value as OfflineDocument;
          
          // Apply additional filters
          if (filter?.fileType && !doc.fileType.includes(filter.fileType)) {
            cursor.continue();
            return;
          }

          documents.push(doc);
          
          // Apply limit
          if (filter?.limit && documents.length >= filter.limit) {
            resolve(documents);
            return;
          }

          cursor.continue();
        } else {
          resolve(documents);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const store = await this.getStore('documents', 'readwrite');
    
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Session operations
  async createSession(documentIds: string[]): Promise<string> {
    const id = crypto.randomUUID();
    const session: OfflineProcessingSession = {
      id,
      documents: documentIds,
      status: 'active',
      createdAt: new Date(),
    };

    const store = await this.getStore('sessions', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.add(session);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async getSession(id: string): Promise<OfflineProcessingSession | null> {
    const store = await this.getStore('sessions');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getSessions(status?: OfflineProcessingSession['status']): Promise<OfflineProcessingSession[]> {
    const store = await this.getStore('sessions');
    
    return new Promise((resolve, reject) => {
      const sessions: OfflineProcessingSession[] = [];
      const request = status ? 
        store.index('status').openCursor(IDBKeyRange.only(status)) :
        store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          sessions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Storage statistics
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const documents = await this.getDocuments();
    
    const stats = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    documents.forEach(doc => {
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
      stats.byType[doc.fileType] = (stats.byType[doc.fileType] || 0) + 1;
    });

    return stats;
  }

  // Sync operations
  async getPendingSyncDocuments(): Promise<OfflineDocument[]> {
    return this.getDocuments({ 
      status: 'processed' // Documents that are processed but not synced
    });
  }

  async markAsSynced(documentId: string): Promise<void> {
    await this.updateDocument(documentId, {
      status: 'synced',
      syncedAt: new Date(),
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const store = await this.getStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const store = await this.getStore('settings', 'readwrite');
    
    await new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup operations
  async cleanup(olderThan: Date): Promise<number> {
    const documents = await this.getDocuments();
    const toDelete = documents.filter(doc => 
      doc.status === 'synced' && doc.syncedAt && doc.syncedAt < olderThan
    );

    for (const doc of toDelete) {
      await this.deleteDocument(doc.id);
    }

    return toDelete.length;
  }

  // Database info
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    size?: number;
    isSupported: boolean;
  }> {
    const isSupported = 'indexedDB' in window;
    let size: number | undefined;

    if (isSupported && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        size = estimate.usage;
      } catch (e) {
        // Storage estimate not available
      }
    }

    return {
      name: this.dbName,
      version: this.version,
      size,
      isSupported,
    };
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorageService();