'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function GuestModeHeader() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsGuestMode(searchParams.get('mode') === 'guest');
  }, [searchParams]);

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return null;
  }

  // Only show for guest users (not authenticated and in guest mode)
  if (session || !isGuestMode) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👤</span>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Guest Mode</h3>
            <p className="text-xs text-blue-700">
              You're using ExamDoc as a guest. Files won't be saved permanently.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export function GuestLimitations() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsGuestMode(searchParams.get('mode') === 'guest');
  }, [searchParams]);

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return null;
  }

  // Only show for guest users
  if (session || !isGuestMode) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Guest Mode Limitations</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Files are processed locally and not saved permanently</li>
            <li>• No document history or cloud backup</li>
            <li>• Limited to basic validation features</li>
            <li>• No personalized DOP bands (manual name entry required)</li>
          </ul>
          <div className="mt-3 flex items-center space-x-3">
            <Link
              href="/auth/signup"
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
            >
              Upgrade to Full Account
            </Link>
            <span className="text-xs text-yellow-600">Free • Takes 30 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}