/**
 * Hybrid Storage Service with Offline-First Architecture
 * Combines Supabase (cloud), IndexedDB (offline), and localStorage (fallback)
 */

import { supabaseStorageService, type StoredDocument } from './SupabaseStorageService';
import { indexedDBStorage, type OfflineDocument } from './IndexedDBStorageService';

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processedText?: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
  createdAt: Date;
  status: 'offline' | 'syncing' | 'synced' | 'failed';
  source: 'indexeddb' | 'supabase' | 'localstorage';
}

export interface StorageStats {
  total: number;
  offline: number;
  synced: number;
  failed: number;
  totalSize: number;
  lastSync?: Date;
  isOnline: boolean;
  hasIndexedDBSupport: boolean;
  hasSupabaseConnection: boolean;
}

class HybridStorageService {
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : false;
  private syncInProgress = false;
  private syncQueue: string[] = [];

  constructor() {
    // Only initialize in browser
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initialize IndexedDB
    this.initializeOfflineStorage();
  }

  private async initializeOfflineStorage(): Promise<void> {
    try {
      await indexedDBStorage.initialize();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Store a document with offline-first approach
   */
  async storeDocument(file: File, processedData?: any): Promise<string> {
    try {
      // Always store in IndexedDB first for offline access
      const offlineId = await indexedDBStorage.storeDocument(file, processedData);

      // If online, try to sync to Supabase in the background
      if (this.isOnline) {
        this.queueForSync(offlineId);
      }

      return offlineId;
    } catch (error) {
      console.error('Error storing document:', error);
      
      // Fallback to localStorage for critical data
      const fallbackId = crypto.randomUUID();
      const fallbackData = {
        id: fallbackId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        processedData,
        createdAt: new Date().toISOString(),
        status: 'offline',
      };

      try {
        localStorage.setItem(`doc_${fallbackId}`, JSON.stringify(fallbackData));
        return fallbackId;
      } catch (localError) {
        throw new Error('Failed to store document in any storage system');
      }
    }
  }

  /**
   * Retrieve documents from all storage systems
   */
  async getStoredDocuments(): Promise<ProcessedDocument[]> {
    const documents: ProcessedDocument[] = [];

    // Get documents from IndexedDB
    try {
      const indexedDBDocs = await indexedDBStorage.getDocuments();
      documents.push(...indexedDBDocs.map(this.convertFromIndexedDB));
    } catch (error) {
      console.error('Error loading IndexedDB documents:', error);
    }

    // Get documents from Supabase (if online)
    if (this.isOnline) {
      try {
        const supabaseDocs = await supabaseStorageService.getStoredDocuments();
        documents.push(...supabaseDocs.map((doc: StoredDocument) => ({
          id: doc.id,
          fileName: doc.originalName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          processedText: doc.extractedText,
          metadata: { templateId: doc.templateId, complianceScore: doc.complianceScore },
          thumbnailUrl: undefined,
          createdAt: new Date(doc.createdAt),
          status: 'synced' as const,
          source: 'supabase' as const,
        })));
      } catch (error) {
        console.error('Error loading Supabase documents:', error);
      }
    }

    // Get documents from localStorage fallback
    try {
      const localStorageKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('doc_'));

      for (const key of localStorageKeys) {
        try {
          const docData = JSON.parse(localStorage.getItem(key)!);
          documents.push({
            ...docData,
            createdAt: new Date(docData.createdAt),
            source: 'localstorage' as const,
          });
        } catch (error) {
          console.error(`Error parsing localStorage document ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading localStorage documents:', error);
    }

    // Remove duplicates (prefer synced > indexeddb > localstorage)
    return this.deduplicateDocuments(documents);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const documents = await this.getStoredDocuments();
    const indexedDBInfo = await indexedDBStorage.getDatabaseInfo();
    
    const stats: StorageStats = {
      total: documents.length,
      offline: documents.filter(doc => doc.status === 'offline').length,
      synced: documents.filter(doc => doc.status === 'synced').length,
      failed: documents.filter(doc => doc.status === 'failed').length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      isOnline: this.isOnline,
      hasIndexedDBSupport: indexedDBInfo.isSupported,
      hasSupabaseConnection: false, // Will be updated by connection check
    };

    // Check Supabase connection
    try {
      const connectionStatus = await supabaseStorageService.getConnectionStatus();
      stats.hasSupabaseConnection = connectionStatus.connected;
    } catch (error) {
      stats.hasSupabaseConnection = false;
    }

    // Get last sync time
    try {
      const lastSync = await indexedDBStorage.getSetting('lastSyncTime');
      if (lastSync) {
        stats.lastSync = new Date(lastSync);
      }
    } catch (error) {
      console.error('Error getting last sync time:', error);
    }

    return stats;
  }

  /**
   * Manually trigger sync
   */
  async syncToCloud(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let success = 0;
    let failed = 0;

    try {
      // Get documents that need syncing
      const pendingDocs = await indexedDBStorage.getPendingSyncDocuments();

      for (const doc of pendingDocs) {
        try {
          // Convert to File object for Supabase upload
          const file = new File([doc.originalFile], doc.fileName, { 
            type: doc.fileType 
          });

          // Convert to Supabase document format
          const supabaseDoc = {
            filename: doc.fileName,
            originalName: doc.fileName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            templateId: 'default',
            processingStatus: 'completed' as const,
            extractedText: doc.processedData?.text,
            pageCount: doc.processedData?.metadata?.pageCount || 1,
            optimizedSize: doc.fileSize,
            complianceScore: 100,
            validationIssues: [],
            processedAt: new Date().toISOString()
          };

          // Upload to Supabase
          await supabaseStorageService.storeDocument(supabaseDoc);

          // Mark as synced in IndexedDB
          await indexedDBStorage.markAsSynced(doc.id);

          success++;
        } catch (error) {
          console.error(`Failed to sync document ${doc.id}:`, error);
          
          // Mark as failed
          await indexedDBStorage.updateDocument(doc.id, {
            status: 'failed',
          });

          failed++;
        }
      }

      // Update last sync time
      await indexedDBStorage.setSetting('lastSyncTime', new Date().toISOString());

    } finally {
      this.syncInProgress = false;
    }

    return { success, failed };
  }

  /**
   * Queue document for background sync
   */
  private queueForSync(documentId: string): void {
    if (!this.syncQueue.includes(documentId)) {
      this.syncQueue.push(documentId);
    }

    // Trigger background sync with delay
    setTimeout(() => this.processNextInQueue(), 1000);
  }

  /**
   * Process next document in sync queue
   */
  private async processNextInQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    const documentId = this.syncQueue.shift()!;

    try {
      const doc = await indexedDBStorage.getDocument(documentId);
      if (!doc || doc.status === 'synced') return;

      // Upload to Supabase
      const file = new File([doc.originalFile], doc.fileName, { 
        type: doc.fileType 
      });

      // Convert to Supabase document format
      const supabaseDoc = {
        filename: doc.fileName,
        originalName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        templateId: 'default',
        processingStatus: 'completed' as const,
        extractedText: doc.processedData?.text,
        pageCount: doc.processedData?.metadata?.pageCount || 1,
        optimizedSize: doc.fileSize,
        complianceScore: 100,
        validationIssues: [],
        processedAt: new Date().toISOString()
      };

      await supabaseStorageService.storeDocument(supabaseDoc);
      await indexedDBStorage.markAsSynced(documentId);

    } catch (error) {
      console.error(`Background sync failed for ${documentId}:`, error);
      
      // Mark as failed and retry later
      await indexedDBStorage.updateDocument(documentId, {
        status: 'failed',
      });
    }

    // Continue with next item
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.processNextInQueue(), 2000);
    }
  }

  /**
   * Trigger background sync when coming online
   */
  private async triggerBackgroundSync(): Promise<void> {
    setTimeout(async () => {
      try {
        await this.syncToCloud();
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }, 5000); // Wait 5 seconds after coming online
  }

  /**
   * Convert IndexedDB document to ProcessedDocument
   */
  private convertFromIndexedDB(doc: OfflineDocument): ProcessedDocument {
    return {
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      processedText: doc.processedData?.text,
      metadata: doc.processedData?.metadata,
      thumbnailUrl: doc.processedData?.thumbnailUrl,
      createdAt: doc.createdAt,
      status: doc.status === 'synced' ? 'synced' : 'offline',
      source: 'indexeddb',
    };
  }

  /**
   * Remove duplicate documents, preferring cloud > indexeddb > localstorage
   */
  private deduplicateDocuments(documents: ProcessedDocument[]): ProcessedDocument[] {
    const seen = new Set<string>();
    const result: ProcessedDocument[] = [];

    // Sort by preference: supabase > indexeddb > localstorage
    const sorted = documents.sort((a, b) => {
      const order = { supabase: 0, indexeddb: 1, localstorage: 2 };
      return order[a.source] - order[b.source];
    });

    for (const doc of sorted) {
      const key = `${doc.fileName}_${doc.fileSize}_${doc.createdAt.getTime()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(doc);
      }
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Clean up old documents
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await indexedDBStorage.cleanup(cutoffDate);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueLength: number;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      queueLength: this.syncQueue.length,
    };
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorageService();