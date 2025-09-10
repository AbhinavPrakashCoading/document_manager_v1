'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export function WelcomeToast() {
  useEffect(() => {
    toast.success(
      '📄 ExamDoc helps you upload exam documents, validate them instantly, and package them into a submission-ready ZIP — all powered by a schema-aware engine tailored to SSC, UPSC, and IELTS workflows.',
      {
        duration: 8000,
        position: 'top-center',
      }
    );
  }, []);

  return <Toaster />;
}
