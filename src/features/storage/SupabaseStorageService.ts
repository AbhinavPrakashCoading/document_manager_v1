// Enhanced Document Storage Service with Supabase Integration
'use client';

import { supabase, DocumentRecord, ProcessingSession } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface StoredDocument {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  templateId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  pageCount?: number;
  optimizedSize?: number;
  complianceScore: number;
  validationIssues?: any[];
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface ProcessingSessionData {
  id: string;
  templateId: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  complianceScore: number;
  totalSizeSaved: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

class SupabaseStorageService {
  private userId: string = 'demo-user'; // In real app, get from auth
  private isSupabaseAvailable: boolean | null = null;

  // Check if Supabase is available
  private async checkSupabaseConnection(): Promise<boolean> {
    if (this.isSupabaseAvailable !== null) {
      return this.isSupabaseAvailable;
    }

    try {
      const { error } = await supabase.from('documents').select('count').limit(1);
      this.isSupabaseAvailable = !error;
      return this.isSupabaseAvailable;
    } catch (error) {
      console.warn('Supabase connection failed, using local storage fallback');
      this.isSupabaseAvailable = false;
      return false;
    }
  }

  // Store document processing results
  async storeDocument(document: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredDocument> {
    const isConnected = await this.checkSupabaseConnection();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            user_id: this.userId,
            filename: document.filename,
            original_name: document.originalName,
            file_type: document.fileType,
            file_size: document.fileSize,
            template_id: document.templateId,
            processing_status: document.processingStatus,
            extracted_text: document.extractedText,
            page_count: document.pageCount,
            optimized_size: document.optimizedSize,
            compliance_score: document.complianceScore,
            validation_issues: document.validationIssues,
            processed_at: document.processedAt
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Document stored in database!', { icon: '🗄️' });
        return this.mapSupabaseToStoredDocument(data);
      } catch (error) {
        console.warn('Failed to store in Supabase, using localStorage:', error);
        return this.storeInLocalStorage(document);
      }
    }
    
    return this.storeInLocalStorage(document);
  }

  // Fallback to localStorage when Supabase is not available
  private storeInLocalStorage(document: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>): StoredDocument {
    const now = new Date().toISOString();
    const storedDoc: StoredDocument = {
      ...document,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };

    // Get existing documents
    const existing = this.getLocalStorageDocuments();
    existing.push(storedDoc);

    // Store in localStorage
    localStorage.setItem('stored_documents', JSON.stringify(existing));
    
    toast.success('Document stored locally (offline mode)', { icon: '💾' });
    return storedDoc;
  }

  // Get stored documents (try Supabase first, fallback to localStorage)
  async getStoredDocuments(): Promise<StoredDocument[]> {
    const isConnected = await this.checkSupabaseConnection();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapSupabaseToStoredDocument);
      } catch (error) {
        console.warn('Failed to fetch from Supabase, using localStorage:', error);
      }
    }
    
    return this.getLocalStorageDocuments();
  }

  private getLocalStorageDocuments(): StoredDocument[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('stored_documents');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Create a processing session
  async createProcessingSession(sessionData: Omit<ProcessingSessionData, 'id' | 'createdAt'>): Promise<ProcessingSessionData> {
    const isConnected = await this.checkSupabaseConnection();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from('processing_sessions')
          .insert({
            user_id: this.userId,
            template_id: sessionData.templateId,
            total_files: sessionData.totalFiles,
            processed_files: sessionData.processedFiles,
            failed_files: sessionData.failedFiles,
            compliance_score: sessionData.complianceScore,
            total_size_saved: sessionData.totalSizeSaved,
            status: sessionData.status,
            completed_at: sessionData.completedAt
          })
          .select()
          .single();

        if (error) throw error;
        return this.mapSupabaseToProcessingSession(data);
      } catch (error) {
        console.warn('Failed to store session in Supabase, using localStorage:', error);
      }
    }
    
    return this.storeSessionInLocalStorage(sessionData);
  }

  private storeSessionInLocalStorage(sessionData: Omit<ProcessingSessionData, 'id' | 'createdAt'>): ProcessingSessionData {
    const now = new Date().toISOString();
    const session: ProcessingSessionData = {
      ...sessionData,
      id: `session_${Date.now()}`,
      createdAt: now
    };

    const existing = this.getLocalStorageSessions();
    existing.push(session);
    localStorage.setItem('processing_sessions', JSON.stringify(existing));

    return session;
  }

  // Get processing sessions
  async getProcessingSessions(): Promise<ProcessingSessionData[]> {
    const isConnected = await this.checkSupabaseConnection();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from('processing_sessions')
          .select('*')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapSupabaseToProcessingSession);
      } catch (error) {
        console.warn('Failed to fetch sessions from Supabase, using localStorage:', error);
      }
    }
    
    return this.getLocalStorageSessions();
  }

  private getLocalStorageSessions(): ProcessingSessionData[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('processing_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading sessions from localStorage:', error);
      return [];
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSizeBytes: number;
    completedDocuments: number;
    recentSessions: number;
    storageType: 'supabase' | 'local';
  }> {
    const documents = await this.getStoredDocuments();
    const sessions = await this.getProcessingSessions();
    const isConnected = await this.checkSupabaseConnection();
    
    return {
      totalDocuments: documents.length,
      totalSizeBytes: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      completedDocuments: documents.filter(doc => doc.processingStatus === 'completed').length,
      recentSessions: sessions.filter(session => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(session.createdAt) > dayAgo;
      }).length,
      storageType: isConnected ? 'supabase' : 'local'
    };
  }

  // Helper methods for mapping Supabase data
  private mapSupabaseToStoredDocument(data: any): StoredDocument {
    return {
      id: data.id,
      filename: data.filename,
      originalName: data.original_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      templateId: data.template_id,
      processingStatus: data.processing_status,
      extractedText: data.extracted_text,
      pageCount: data.page_count,
      optimizedSize: data.optimized_size,
      complianceScore: data.compliance_score,
      validationIssues: data.validation_issues,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      processedAt: data.processed_at
    };
  }

  private mapSupabaseToProcessingSession(data: any): ProcessingSessionData {
    return {
      id: data.id,
      templateId: data.template_id,
      totalFiles: data.total_files,
      processedFiles: data.processed_files,
      failedFiles: data.failed_files,
      complianceScore: data.compliance_score,
      totalSizeSaved: data.total_size_saved,
      status: data.status,
      createdAt: data.created_at,
      completedAt: data.completed_at
    };
  }

  // Get connection status
  async getConnectionStatus(): Promise<{
    connected: boolean;
    type: 'supabase' | 'local';
    message: string;
  }> {
    const isConnected = await this.checkSupabaseConnection();
    
    return {
      connected: isConnected,
      type: isConnected ? 'supabase' : 'local',
      message: isConnected 
        ? 'Connected to Supabase database'
        : 'Using local storage (offline mode)'
    };
  }
}

export const supabaseStorageService = new SupabaseStorageService();