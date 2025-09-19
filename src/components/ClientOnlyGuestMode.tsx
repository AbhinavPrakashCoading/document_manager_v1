'use client';

import dynamic from 'next/dynamic';

// Client-only components to avoid SSR issues with useSearchParams
export const GuestModeHeader = dynamic(
  () => import('./GuestModeComponents').then(mod => ({ default: mod.GuestModeHeader })),
  { 
    ssr: false,
    loading: () => <div />
  }
);

export const GuestLimitations = dynamic(
  () => import('./GuestModeComponents').then(mod => ({ default: mod.GuestLimitations })),
  { 
    ssr: false,
    loading: () => <div />
  }
);

export const ExamGrid = dynamic(
  () => import('./exam-selector/ExamGrid').then(mod => ({ default: mod.ExamGrid })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-64 flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    )
  }
);