'use client';

import GuestMode from '@/components/GuestMode';
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
    <GuestMode 
      onExamSelect={(examType) => {
        // Optional callback for analytics/tracking
        console.log('Exam selected:', examType);
      }}
      redirectTo="/dashboard"
      isLoading={false}
    />
  );
}
