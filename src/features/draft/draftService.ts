// Draft Storage Service - Handles auto-save functionality
import { ExamSchema } from '@/features/exam/examSchema';

export interface DraftData {
  id: string;
  userId?: string; // For authenticated users
  sessionId: string; // For guest users
  examId: string;
  examSchema?: ExamSchema;
  formData: {
    rollNumber?: string;
    personalInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
    };
    documentMetadata?: {
      [documentType: string]: {
        fileName: string;
        fileSize: number;
        uploadedAt: Date;
        validationStatus: 'pending' | 'valid' | 'invalid';
        errors?: string[];
      };
    };
    uploadProgress?: {
      totalFiles: number;
      uploadedFiles: number;
      validFiles: number;
      currentStep: 'selection' | 'upload' | 'validation' | 'review' | 'complete';
    };
  };
  files?: {
    [documentType: string]: {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      // File data stored as base64 for localStorage
      data?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isAutoSave: boolean;
}

export interface DraftConfig {
  autoSaveInterval: number; // milliseconds
  maxDrafts: number;
  enableCompression: boolean;
  enableCloudSync: boolean; // Future feature
  retention: {
    guestDrafts: number; // days
    userDrafts: number; // days
  };
}

export class DraftService {
  private static instance: DraftService;
  private config: DraftConfig;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.config = {
      autoSaveInterval: 3000, // 3 seconds
      maxDrafts: 10,
      enableCompression: true,
      enableCloudSync: false,
      retention: {
        guestDrafts: 7,
        userDrafts: 30,
      },
    };
  }

  static getInstance(): DraftService {
    if (!DraftService.instance) {
      DraftService.instance = new DraftService();
    }
    return DraftService.instance;
  }

  // Generate session ID for guest users
  private getSessionId(): string {
    const stored = localStorage.getItem('draft_session_id');
    if (stored) return stored;
    
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('draft_session_id', sessionId);
    return sessionId;
  }

  // Generate draft ID
  private generateDraftId(examId: string, userId?: string): string {
    const identifier = userId || this.getSessionId();
    return `draft_${examId}_${identifier}`;
  }

  // Get draft key for localStorage
  private getDraftKey(draftId: string): string {
    return `examdoc_draft_${draftId}`;
  }

  // Create new draft
  async createDraft(examId: string, initialData: Partial<DraftData['formData']> = {}, userId?: string): Promise<DraftData> {
    const draftId = this.generateDraftId(examId, userId);
    const sessionId = this.getSessionId();
    
    const draft: DraftData = {
      id: draftId,
      userId,
      sessionId,
      examId,
      formData: {
        uploadProgress: {
          totalFiles: 0,
          uploadedFiles: 0,
          validFiles: 0,
          currentStep: 'selection',
        },
        ...initialData,
      },
      files: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isAutoSave: false,
    };

    await this.saveDraft(draft);
    return draft;
  }

  // Save draft to localStorage
  async saveDraft(draft: DraftData): Promise<void> {
    try {
      draft.updatedAt = new Date();
      draft.version += 1;
      
      const key = this.getDraftKey(draft.id);
      const data = this.config.enableCompression 
        ? this.compressData(draft)
        : JSON.stringify(draft);
      
      localStorage.setItem(key, data);
      
      // Also save to indexedDB for larger files (future enhancement)
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        // Implementation for indexedDB storage
      }
      
      // Emit event for UI updates
      this.emitDraftSaved(draft);
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Draft save failed');
    }
  }

  // Get draft by ID
  async getDraft(examId: string, userId?: string): Promise<DraftData | null> {
    try {
      const draftId = this.generateDraftId(examId, userId);
      const key = this.getDraftKey(draftId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const draft = this.config.enableCompression 
        ? this.decompressData(stored)
        : JSON.parse(stored);
      
      // Convert date strings back to Date objects
      draft.createdAt = new Date(draft.createdAt);
      draft.updatedAt = new Date(draft.updatedAt);
      
      return draft;
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }

  // Get all drafts for a user/session
  async getAllDrafts(userId?: string): Promise<DraftData[]> {
    const drafts: DraftData[] = [];
    const sessionId = this.getSessionId();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('examdoc_draft_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft = this.config.enableCompression 
              ? this.decompressData(stored)
              : JSON.parse(stored);
            
            // Filter by user or session
            if ((userId && draft.userId === userId) || 
                (!userId && draft.sessionId === sessionId)) {
              draft.createdAt = new Date(draft.createdAt);
              draft.updatedAt = new Date(draft.updatedAt);
              drafts.push(draft);
            }
          }
        } catch (error) {
          console.error('Failed to parse draft:', key, error);
        }
      }
    }
    
    return drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Update draft with debouncing
  async updateDraftDebounced(
    examId: string, 
    updates: Partial<DraftData['formData']>, 
    userId?: string
  ): Promise<void> {
    const draftId = this.generateDraftId(examId, userId);
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(draftId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      await this.updateDraft(examId, updates, userId);
      this.debounceTimers.delete(draftId);
    }, this.config.autoSaveInterval);
    
    this.debounceTimers.set(draftId, timer);
  }

  // Update draft immediately
  async updateDraft(
    examId: string, 
    updates: Partial<DraftData['formData']>, 
    userId?: string
  ): Promise<void> {
    let draft = await this.getDraft(examId, userId);
    
    if (!draft) {
      draft = await this.createDraft(examId, updates, userId);
    } else {
      draft.formData = { ...draft.formData, ...updates };
      draft.isAutoSave = true;
      await this.saveDraft(draft);
    }
  }

  // Add file to draft
  async addFileToDraft(
    examId: string,
    documentType: string,
    file: File,
    userId?: string
  ): Promise<void> {
    let draft = await this.getDraft(examId, userId);
    
    if (!draft) {
      draft = await this.createDraft(examId, {}, userId);
    }
    
    // Convert file to base64 for storage
    const fileData = await this.fileToBase64(file);
    
    draft.files = {
      ...draft.files,
      [documentType]: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        data: fileData,
      },
    };
    
    // Update metadata
    draft.formData.documentMetadata = {
      ...draft.formData.documentMetadata,
      [documentType]: {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        validationStatus: 'pending',
      },
    };
    
    await this.saveDraft(draft);
  }

  // Delete draft
  async deleteDraft(examId: string, userId?: string): Promise<void> {
    const draftId = this.generateDraftId(examId, userId);
    const key = this.getDraftKey(draftId);
    localStorage.removeItem(key);
    
    // Clear any pending debounced saves
    const timer = this.debounceTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(draftId);
    }
    
    this.emitDraftDeleted(draftId);
  }

  // Cleanup old drafts
  async cleanupDrafts(): Promise<void> {
    const now = new Date();
    const drafts = await this.getAllDrafts();
    
    for (const draft of drafts) {
      const age = now.getTime() - draft.updatedAt.getTime();
      const maxAge = draft.userId 
        ? this.config.retention.userDrafts * 24 * 60 * 60 * 1000
        : this.config.retention.guestDrafts * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        await this.deleteDraft(draft.examId, draft.userId);
      }
    }
  }

  // Check if draft exists and is newer than last save
  async hasDraftNewer(examId: string, lastSave?: Date, userId?: string): Promise<boolean> {
    const draft = await this.getDraft(examId, userId);
    if (!draft) return false;
    
    if (!lastSave) return true;
    
    return draft.updatedAt > lastSave;
  }

  // Utility methods
  private compressData(data: any): string {
    // Simple compression - could use LZ-string or similar library
    return JSON.stringify(data);
  }

  private decompressData(data: string): any {
    return JSON.parse(data);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  // Event emitters for UI updates
  private emitDraftSaved(draft: DraftData): void {
    window.dispatchEvent(new CustomEvent('draftSaved', { detail: draft }));
  }

  private emitDraftDeleted(draftId: string): void {
    window.dispatchEvent(new CustomEvent('draftDeleted', { detail: { draftId } }));
  }

  // Public API for configuration
  updateConfig(updates: Partial<DraftConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): DraftConfig {
    return { ...this.config };
  }
}

export const draftService = DraftService.getInstance();