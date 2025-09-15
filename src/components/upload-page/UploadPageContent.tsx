'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
      <h1 className="text-xl font-semibold text-center mb-6">
        📄 Upload Documents for {schema.examName}
      </h1>

      {showDraftBanner && availableDraft && (
        <div className="max-w-4xl mx-auto mb-6">
          <DraftRecoveryBanner
            onRestore={() => handleRestoreDraft()}
            onDismiss={handleDismissDraft}
            draftDate={availableDraft.updatedAt}
          />
        </div>
      )}

      <RequirementsPanel schema={schema} />
      <UploadZone schema={schema} />

      {showDraftModal && (
        <DraftRecoveryModal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          onRestore={handleRestoreDraft}
          onStartFresh={handleStartFresh}
          examId={examId}
        />
      )}
    </main>
  );
}
