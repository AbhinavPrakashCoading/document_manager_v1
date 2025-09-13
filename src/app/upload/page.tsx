'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UploadPageContent = dynamic(
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  );
}
