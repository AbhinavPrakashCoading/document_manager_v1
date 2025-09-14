'use client';

import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { GuestModeHeader } from '@/components/ClientOnlyGuestMode';

const UploadPageContent = dynamicImport(
  () => import('@/components/upload-page/UploadPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    ),
  }
);

export default function UploadPage() {
  return (
    <>
      <GuestModeHeader />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
          Loading...
        </div>
      }>
        <UploadPageContent />
      </Suspense>
    </>
  );
}
