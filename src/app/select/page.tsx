'use client';

import { ExamGrid } from '@/components/exam-selector/ExamGrid';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function SelectPage() {
  useEffect(() => {
    toast.success(
      '📄 ExamDoc helps you upload exam documents, validate them instantly, and package them into a submission-ready ZIP — all powered by a schema-aware engine tailored to SSC, UPSC, and IELTS workflows.',
      {
        duration: 8000,
        position: 'top-center',
      }
    );
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 space-y-8">
      <ExamGrid />
      <footer className="text-xs text-gray-500 text-center pt-12">
        Made by Abhinav • Powered by Registry Engine ⚙️
      </footer>
    </main>
  );
}
