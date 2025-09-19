// Auto-save React Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { draftService, DraftData } from '@/features/draft/draftService';

export interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
  isDraft: boolean;
  version?: number;
}

export interface AutoSaveOptions {
  examId: string;
  enabled?: boolean;
  saveInterval?: number;
  onError?: (error: string) => void;
  onSave?: (draft: DraftData) => void;
  onRestore?: (draft: DraftData) => void;
}

export function useAutoSave(options: AutoSaveOptions) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<AutoSaveStatus>({
    status: 'idle',
    isDraft: false,
  });
  
  const [formData, setFormData] = useState<DraftData['formData']>({
    uploadProgress: {
      totalFiles: 0,
      uploadedFiles: 0,
      validFiles: 0,
      currentStep: 'selection',
    },
  });
  
  const [files, setFiles] = useState<DraftData['files']>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const isInitialized = useRef(false);
  const lastSaveData = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const userId = session?.user?.email; // Using email as user identifier
  const { examId, enabled = true, saveInterval = 3000, onError, onSave, onRestore } = options;

  // Initialize and restore draft on mount
  useEffect(() => {
    if (!enabled || isInitialized.current) return;
    
    const initializeDraft = async () => {
      try {
        const existingDraft = await draftService.getDraft(examId, userId || undefined);
        
        if (existingDraft) {
          setFormData(existingDraft.formData);
          setFiles(existingDraft.files || {});
          setStatus({
            status: 'saved',
            lastSaved: existingDraft.updatedAt,
            isDraft: true,
            version: existingDraft.version,
          });
          onRestore?.(existingDraft);
        } else {
          // Create initial draft
          const newDraft = await draftService.createDraft(examId, formData, userId || undefined);
          setStatus({
            status: 'saved',
            lastSaved: newDraft.updatedAt,
            isDraft: true,
            version: newDraft.version,
          });
        }
        
        isInitialized.current = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize draft';
        setStatus({ status: 'error', error: errorMessage, isDraft: false });
        onError?.(errorMessage);
      }
    };
    
    initializeDraft();
  }, [examId, userId, enabled]);

  // Auto-save when data changes
  const triggerSave = useCallback(async (immediate = false) => {
    if (!enabled || !isInitialized.current) return;
    
    const currentData = JSON.stringify({ formData, files });
    if (currentData === lastSaveData.current && !immediate) return;
    
    setStatus(prev => ({ ...prev, status: 'saving' }));
    
    try {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      const saveOperation = async () => {
        await draftService.updateDraft(examId, formData, userId || undefined);
        
        // Save files separately if they've changed
        for (const [documentType, fileData] of Object.entries(files || {})) {
          if (fileData.data) {
            // Convert base64 back to file for storage
            const file = new File([fileData.data], fileData.name, { type: fileData.type });
            await draftService.addFileToDraft(examId, documentType, file, userId || undefined);
          }
        }
        
        const updatedDraft = await draftService.getDraft(examId, userId || undefined);
        lastSaveData.current = currentData;
        setHasUnsavedChanges(false);
        
        setStatus({
          status: 'saved',
          lastSaved: new Date(),
          isDraft: true,
          version: updatedDraft?.version,
        });
        
        if (updatedDraft) {
          onSave?.(updatedDraft);
        }
      };
      
      if (immediate) {
        await saveOperation();
      } else {
        saveTimeoutRef.current = setTimeout(saveOperation, saveInterval);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [examId, userId, formData, files, enabled, saveInterval, onSave, onError]);

  // Update form data with auto-save trigger
  const updateFormData = useCallback((updates: Partial<DraftData['formData']>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      
      // Trigger auto-save after state update
      setTimeout(() => triggerSave(), 0);
      
      return newData;
    });
  }, [triggerSave]);

  // Add file with auto-save
  const addFile = useCallback(async (documentType: string, file: File) => {
    if (!enabled) return;
    
    try {
      // Convert file to base64 for state management
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          data: reader.result as string,
        };
        
        setFiles(prev => ({
          ...prev,
          [documentType]: fileData,
        }));
        
        // Update document metadata
        updateFormData({
          documentMetadata: {
            ...formData.documentMetadata,
            [documentType]: {
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: new Date(),
              validationStatus: 'pending',
            },
          },
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add file';
      setStatus(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [enabled, formData.documentMetadata, updateFormData, onError]);

  // Remove file with auto-save
  const removeFile = useCallback((documentType: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      setHasUnsavedChanges(true);
      
      // Trigger auto-save
      setTimeout(() => triggerSave(), 0);
      
      return newFiles;
    });
    
    // Update form data to remove metadata
    const currentMetadata = formData.documentMetadata || {};
    const updatedMetadata = { ...currentMetadata };
    delete updatedMetadata[documentType];
    
    updateFormData({
      documentMetadata: updatedMetadata,
    });
  }, [triggerSave, formData.documentMetadata, updateFormData]);

  // Force save
  const forceSave = useCallback(async () => {
    await triggerSave(true);
  }, [triggerSave]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    try {
      await draftService.deleteDraft(examId, userId || undefined);
      setFormData({
        uploadProgress: {
          totalFiles: 0,
          uploadedFiles: 0,
          validFiles: 0,
          currentStep: 'selection',
        },
      });
      setFiles({});
      setStatus({ status: 'idle', isDraft: false });
      setHasUnsavedChanges(false);
      lastSaveData.current = '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear draft';
      onError?.(errorMessage);
    }
  }, [examId, userId, onError]);

  // Get file as File object
  const getFile = useCallback((documentType: string): File | null => {
    const fileData = files?.[documentType];
    if (!fileData?.data) return null;
    
    try {
      const byteCharacters = atob(fileData.data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new File([byteArray], fileData.name, { type: fileData.type });
    } catch (error) {
      console.error('Failed to convert file data:', error);
      return null;
    }
  }, [files]);

  // Check if draft exists
  const hasDraft = useCallback(async (): Promise<boolean> => {
    const draft = await draftService.getDraft(examId, userId || undefined);
    return !!draft;
  }, [examId, userId]);

  // Restore draft from specific version
  const restoreDraft = useCallback(async () => {
    try {
      const draft = await draftService.getDraft(examId, userId || undefined);
      if (draft) {
        setFormData(draft.formData);
        setFiles(draft.files || {});
        setStatus({
          status: 'saved',
          lastSaved: draft.updatedAt,
          isDraft: true,
          version: draft.version,
        });
        setHasUnsavedChanges(false);
        onRestore?.(draft);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore draft';
      setStatus(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [examId, userId, onRestore, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    formData,
    files,
    status,
    hasUnsavedChanges,
    
    // Actions
    updateFormData,
    addFile,
    removeFile,
    getFile,
    forceSave,
    clearDraft,
    restoreDraft,
    hasDraft,
    
    // Utilities
    isInitialized: isInitialized.current,
  };
}