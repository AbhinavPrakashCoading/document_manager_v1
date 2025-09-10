'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 space-y-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-center">
        📄 ExamDoc Uploader
      </h1>

      <p className="text-gray-600 text-center max-w-xl text-sm">
        Upload your exam documents, validate them instantly, and package them for submission — all powered by a schema-aware engine.
      </p>

      <div className="flex gap-4 text-2xl">
        <span title="SSC">📜</span>
        <span title="UPSC">🗳️</span>
        <span title="IELTS">🌍</span>
      </div>

      <Link
        href="/select"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm"
      >
        Get Started
      </Link>

      <footer className="text-xs text-gray-500 pt-12">
        Made by Abhinav • Powered by Registry Engine ⚙️
      </footer>
    </main>
  );
}