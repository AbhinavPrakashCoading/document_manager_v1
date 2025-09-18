'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import PWA components with no SSR
const PWAInstallPrompt = dynamic(
  () => import('./PWA').then((mod) => ({ default: mod.PWAInstallPrompt })),
  { ssr: false }
);

const PWAStatusIndicator = dynamic(
  () => import('./PWA').then((mod) => ({ default: mod.PWAStatusIndicator })),
  { ssr: false }
);

export function ClientPWAInstallPrompt() {
  return (
    <Suspense fallback={null}>
      <PWAInstallPrompt />
    </Suspense>
  );
}

export function ClientPWAStatusIndicator() {
  return (
    <Suspense fallback={<div className="text-xs text-gray-500">Loading PWA status...</div>}>
      <PWAStatusIndicator />
    </Suspense>
  );
}