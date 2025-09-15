// Draft List Component for Dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Trash2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DraftData, draftService } from '@/features/draft/draftService';
import toast from 'react-hot-toast';

export function DraftsList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = session?.user?.email;

  useEffect(() => {
    loadDrafts();
  }, [userId]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const allDrafts = await draftService.getAllDrafts(userId || undefined);
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueDraft = (draft: DraftData) => {
    // Navigate to upload page with exam parameter
    router.push(`/upload?exam=${draft.examId}&continue=draft`);
  };

  const handleDeleteDraft = async (draft: DraftData) => {
    try {
      await draftService.deleteDraft(draft.examId, userId || undefined);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      toast.success('Draft deleted');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getDraftProgress = (draft: DraftData) => {
    const progress = draft.formData.uploadProgress;
    if (!progress) return { percentage: 0, label: 'Not started' };
    
    const percentage = progress.totalFiles > 0 
      ? Math.round((progress.validFiles / progress.totalFiles) * 100)
      : 0;
      
    return {
      percentage,
      label: `${progress.validFiles}/${progress.totalFiles} files`
    };
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'selection': return 'Exam Selection';
      case 'upload': return 'File Upload';
      case 'validation': return 'Validation';
      case 'review': return 'Review';
      case 'complete': return 'Complete';
      default: return 'In Progress';
    }
  };

  const getExamIcon = (examId: string) => {
    switch (examId.toLowerCase()) {
      case 'upsc': return '🗳️';
      case 'ssc': return '📜';
      case 'ielts': return '🌍';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Drafts</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Drafts</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No drafts found</p>
          <p className="text-gray-400 text-xs mt-1">Your work will be auto-saved as you progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Drafts</h3>
        </div>
        <span className="text-xs text-gray-500">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => {
          const progress = getDraftProgress(draft);
          const currentStep = draft.formData.uploadProgress?.currentStep || 'upload';
          
          return (
            <div
              key={draft.id}
              className="border rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getExamIcon(draft.examId)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {draft.examId.toUpperCase()} Application
                      </h4>
                      {draft.userId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          <User className="w-3 h-3 mr-1" />
                          Saved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {getStepLabel(currentStep)} • {progress.label}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteDraft(draft)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatTimeAgo(new Date(draft.updatedAt))}</span>
                  {draft.formData.rollNumber && (
                    <span className="ml-3">Roll: {draft.formData.rollNumber}</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleContinueDraft(draft)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cleanup info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Auto-save:</span> Your progress is automatically saved every few seconds.
          Guest drafts are kept for 7 days, account drafts for 30 days.
        </p>
      </div>
    </div>
  );
}