// Draft Recovery Modal Component
'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Clock, User, AlertTriangle } from 'lucide-react';
import { DraftData, draftService } from '@/features/draft/draftService';
import { useSession } from 'next-auth/react';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (draft: DraftData) => void;
  onStartFresh: () => void;
  examId: string;
}

export function DraftRecoveryModal({ 
  isOpen, 
  onClose, 
  onRestore, 
  onStartFresh, 
  examId 
}: DraftRecoveryModalProps) {
  const { data: session } = useSession();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userId = session?.user?.email; // Using email as user identifier

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen, examId, userId]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const allDrafts = await draftService.getAllDrafts(userId || undefined);
      const examDrafts = allDrafts.filter(draft => draft.examId === examId);
      setDrafts(examDrafts);
      
      if (examDrafts.length === 1) {
        setSelectedDraft(examDrafts[0]);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    if (selectedDraft) {
      onRestore(selectedDraft);
      onClose();
    }
  };

  const handleStartFresh = async () => {
    if (selectedDraft) {
      await draftService.deleteDraft(examId, userId || undefined);
    }
    onStartFresh();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getDraftSummary = (draft: DraftData) => {
    const files = Object.keys(draft.files || {}).length;
    const totalSize = Object.values(draft.files || {}).reduce((sum, file) => sum + file.size, 0);
    const progress = draft.formData.uploadProgress;
    
    return {
      files,
      totalSize,
      step: progress?.currentStep || 'unknown',
      completedFiles: progress?.validFiles || 0,
    };
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'selection': return 'Exam Selection';
      case 'upload': return 'File Upload';
      case 'validation': return 'Validation';
      case 'review': return 'Review';
      case 'complete': return 'Complete';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Restore Previous Work</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No drafts found for this exam.</p>
              <button
                onClick={handleStartFresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Previous work detected</p>
                    <p className="text-amber-700 mt-1">
                      You have unsaved work from a previous session. You can restore it or start fresh.
                    </p>
                  </div>
                </div>
              </div>

              {/* Draft List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Available Drafts:</h3>
                {drafts.map((draft) => {
                  const summary = getDraftSummary(draft);
                  const isSelected = selectedDraft?.id === draft.id;
                  
                  return (
                    <div
                      key={draft.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDraft(draft)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <span className="font-medium text-gray-900">
                              {draft.examId.toUpperCase()} Draft
                            </span>
                            {draft.userId && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                <User className="w-3 h-3 mr-1" />
                                Account
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(draft.updatedAt).toLocaleDateString()} at{' '}
                                {new Date(draft.updatedAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>
                                {summary.files} files ({formatFileSize(summary.totalSize)})
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Step: {getStepLabel(summary.step)}</span>
                            <span>Valid: {summary.completedFiles}/{summary.files}</span>
                            <span>v{draft.version}</span>
                          </div>
                          
                          {/* Form data preview */}
                          {draft.formData.rollNumber && (
                            <div className="mt-2 text-xs text-gray-500">
                              Roll: {draft.formData.rollNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected draft details */}
              {selectedDraft && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Draft Contents:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedDraft.formData.rollNumber && (
                      <p>• Roll Number: {selectedDraft.formData.rollNumber}</p>
                    )}
                    {selectedDraft.formData.personalInfo?.name && (
                      <p>• Name: {selectedDraft.formData.personalInfo.name}</p>
                    )}
                    {Object.keys(selectedDraft.files || {}).length > 0 && (
                      <p>• Files: {Object.keys(selectedDraft.files || {}).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && drafts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <button
              onClick={handleStartFresh}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Fresh
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={!selectedDraft}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDraft
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Restore Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}