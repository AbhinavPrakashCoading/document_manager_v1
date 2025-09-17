/**
 * Client-side storage service that uses API routes
 * This replaces direct server-side imports for client components
 */

export interface Document {
  id: string;
  name: string; // filename
  examType: string;
  status: 'validated' | 'processing' | 'failed' | 'pending' | 'enhancing';
  uploadDate: string;
  size: string; // formatted size
  fileType: string;
  validationScore?: number;
  location: 'drive' | 'local';
  thumbnail?: string;
  processingStage?: string;
  downloadUrl?: string;
  userId?: string;
  isProcessing?: boolean;
}

export interface StorageStats {
  totalDocuments: number;
  storageUsed: number;
  storageLimit: number;
  driveConnected: boolean;
  processingCount: number;
}

export interface ZipCreationResult {
  zipId: string;
  filename: string;
  size: number;
  downloadUrl: string;
}

/**
 * Client-side storage service that communicates with API routes
 */
export class ClientStorageService {
  private static instance: ClientStorageService;
  
  private constructor() {}
  
  static getInstance(): ClientStorageService {
    if (!this.instance) {
      this.instance = new ClientStorageService();
    }
    return this.instance;
  }

  /**
   * Get storage statistics for the current user
   */
  async getStorageStats(): Promise<StorageStats> {
    const response = await fetch('/api/storage/stats/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch storage stats');
    }

    return response.json();
  }

  /**
   * Get user documents
   */
  async getUserDocuments(): Promise<Document[]> {
    const response = await fetch('/api/storage/documents/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`/api/storage/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Create a zip file from documents
   */
  async createZip(documentIds: string[], filename: string): Promise<ZipCreationResult> {
    const response = await fetch('/api/storage/zip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentIds,
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create zip');
    }

    return response.json();
  }

  /**
   * Download a document or zip file
   */
  async downloadFile(fileId: string, type: 'document' | 'zip' = 'document'): Promise<void> {
    const endpoint = type === 'zip' ? `/api/storage/zip/${fileId}/download` : `/api/storage/documents/${fileId}/download`;
    
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    // Create download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Get document processing status
   */
  async getDocumentStatus(documentId: string): Promise<Document> {
    const response = await fetch(`/api/storage/documents/${documentId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document status');
    }

    return response.json();
  }
}

// Export singleton instance for client components
export const clientStorageService = ClientStorageService.getInstance();