'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GuestMode from '@/components/GuestMode';
import Dashboard from '@/components/Dashboard';
import toast from 'react-hot-toast';

export default function SelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Show welcome toast on first visit
    toast.success(
      '📄 ExamDoc helps you upload exam documents, validate them instantly, and package them into a submission-ready ZIP — all powered by a schema-aware engine tailored to SSC, UPSC, and IELTS workflows.',
      {
        duration: 8000,
        position: 'top-center',
      }
    );
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Authenticated user detected, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-8 text-center border border-white/30 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show guest mode for unauthenticated users
  if (status === 'unauthenticated') {
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

  // This shouldn't be reached due to the useEffect redirect above,
  // but show dashboard as fallback for authenticated users
  return <Dashboard />;
}
