'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { UploadZone } from '@/components/upload-page/UploadZone';
import { RequirementsPanel } from '@/components/upload-page/RequirementsPanel';
import { DraftRecoveryBanner } from '@/components/draft/DraftStatus';
import { DraftRecoveryModal } from '@/components/draft/DraftRecoveryModal';
import { draftService, DraftData } from '@/features/draft/draftService';
import { getSchema } from '@/lib/schemaRegistry';
import { staticSchemas } from '@/features/exam/staticSchemas';
import { ExamSchema } from '@/features/exam/examSchema';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Dynamic import for OCR component (client-side only)
const OCRComponent = dynamic(() => import('@/components/OCRComponent'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
      <div className="bg-gray-200 h-12 rounded mb-4"></div>
      <div className="bg-gray-200 h-32 rounded"></div>
    </div>
  ),
});

const validExams = ['ssc', 'upsc', 'ielts'];

export default function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [schema, setSchema] = useState<ExamSchema | null>(null);
  const [availableDraft, setAvailableDraft] = useState<DraftData | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [examId, setExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'ocr'>('upload');
  
  const userId = session?.user?.email;
  
  useEffect(() => {
    const currentExamId = searchParams.get('exam') || localStorage.getItem('selectedExam');
    
    if (!currentExamId || !validExams.includes(currentExamId)) {
      router.replace('/select');
      return;
    }
    
    setExamId(currentExamId);
    localStorage.setItem('selectedExam', currentExamId);
    
    const loadSchemaAndCheckDrafts = async () => {
      try {
        // Load schema
        const schemaData = staticSchemas[currentExamId];
        if (schemaData) {
          setSchema(schemaData);
        } else {
          console.error(`Enhanced schema not found for ${currentExamId}`);
          const mod = await import(`@/schemas/${currentExamId}.json`);
          setSchema(mod.default);
        }
        
        // Check for existing drafts
        const draft = await draftService.getDraft(currentExamId, userId || undefined);
        if (draft) {
          setAvailableDraft(draft);
          
          // Show draft recovery options
          const timeSinceUpdate = Date.now() - draft.updatedAt.getTime();
          const oneHourInMs = 60 * 60 * 1000;
          
          // Show banner for recent drafts, modal for older ones
          if (timeSinceUpdate < oneHourInMs) {
            setShowDraftBanner(true);
          } else {
            setShowDraftModal(true);
          }
        }
      } catch (err) {
        console.error(`Schema load failed for ${currentExamId}:`, err);
        router.replace('/select');
      }
    };
    
    loadSchemaAndCheckDrafts();
  }, [router, searchParams, userId]);

  const handleRestoreDraft = async (draft?: DraftData) => {
    try {
      const draftToRestore = draft || availableDraft;
      if (draftToRestore) {
        toast.success(`Draft restored from ${draftToRestore.updatedAt.toLocaleString()}`);
        setShowDraftBanner(false);
        setShowDraftModal(false);
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
      toast.error('Failed to restore draft');
    }
  };

  const handleDismissDraft = async () => {
    setShowDraftBanner(false);
    setShowDraftModal(false);
    if (availableDraft) {
      try {
        await draftService.deleteDraft(examId, userId || undefined);
        toast.success('Draft dismissed');
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
  };

  const handleStartFresh = () => {
    setShowDraftBanner(false);
    setShowDraftModal(false);
    setAvailableDraft(null);
  };

  const handleOCRTextExtracted = (results: Array<{ file: File; text: string; confidence: number }>) => {
    // Handle extracted text from OCR
    const totalWords = results.reduce((sum, result) => sum + result.text.split(' ').length, 0);
    const avgConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
    
    toast.success(
      `OCR completed! ${totalWords} words extracted from ${results.length} image(s) (${avgConfidence.toFixed(1)}% avg confidence)`,
      { icon: '✨', duration: 5000 }
    );
    
    console.log('OCR Results:', results);
  };

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading schema and checking for drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold text-center mb-6">
          📄 Upload Documents for {schema.examName}
        </h1>

        {showDraftBanner && availableDraft && (
          <div className="mb-6">
            <DraftRecoveryBanner
              onRestore={() => handleRestoreDraft()}
              onDismiss={handleDismissDraft}
              draftDate={availableDraft.updatedAt}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex justify-center space-x-1 bg-gray-200 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              📁 File Upload
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'ocr'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              👁️ Text Extraction
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <RequirementsPanel schema={schema} />
            <UploadZone schema={schema} />
          </div>
        )}

        {activeTab === 'ocr' && (
          <div className="space-y-6">
            {/* OCR Info Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <span className="text-2xl">👁️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    OCR Text Extraction
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Extract text from images using free, offline OCR technology. Perfect for digitizing documents, 
                    handwritten notes, or converting images to searchable text.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>100% Free</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Offline Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Multi-language</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>No File Limits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OCR Component */}
            <OCRComponent 
              onTextExtracted={handleOCRTextExtracted}
              maxFiles={10}
              showLanguageSelector={true}
              showPreprocessingOptions={true}
            />
          </div>
        )}

        {showDraftModal && (
          <DraftRecoveryModal
            isOpen={showDraftModal}
            onClose={() => setShowDraftModal(false)}
            onRestore={handleRestoreDraft}
            onStartFresh={handleStartFresh}
            examId={examId}
          />
        )}
      </div>
    </main>
  );
}
