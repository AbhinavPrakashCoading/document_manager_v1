/**
 * Enhanced Upload Page Route with AI-Powered Image Analysis
 * Provides Phase 1 intelligent image quality detection
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestModeHeader } from '@/components/ClientOnlyGuestMode';
import { EnhancedUploadPage } from '@/components/upload-page/EnhancedUploadPage';

function EnhancedUploadPageContent() {
  const searchParams = useSearchParams();
  const examType = searchParams.get('exam') || 'ielts';
  const rollNumber = searchParams.get('roll') || undefined;

  return (
    <EnhancedUploadPage 
      examType={examType}
      rollNumber={rollNumber}
    />
  );
}

export default function EnhancedUploadRoute() {
  return (
    <>
      <GuestModeHeader />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading AI-powered upload form...</p>
          </div>
        </div>
      }>
        <EnhancedUploadPageContent />
      </Suspense>
    </>
  );
}