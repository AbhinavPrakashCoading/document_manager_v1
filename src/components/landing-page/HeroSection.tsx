'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="text-center py-12 px-4 bg-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">📄 ExamDoc Uploader</h1>
      <p className="text-gray-600 text-sm max-w-xl mx-auto mb-6">
        Schema-aware document validation and packaging for SSC, UPSC, and IELTS. Upload your files, validate them instantly, and download a submission-ready ZIP — all in one flow.
      </p>
      
      {session ? (
        <div className="space-y-4">
          <p className="text-green-600 font-medium">
            Welcome back, {session.user?.name || session.user?.email}!
          </p>
          <Link
            href="/select"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm transition-colors"
          >
            Continue to App
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/signin"
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-50 text-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>
          
          <div className="text-center">
            <Link
              href="/select?mode=guest"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors"
            >
              <span className="mr-1">👤</span>
              Try as Guest (no account required)
            </Link>
            <p className="text-xs text-gray-500 mt-1">
              Limited features • Files not saved • No document history
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
