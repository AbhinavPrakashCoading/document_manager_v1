'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DocKitEntryPoint() {
  const router = useRouter();

  useEffect(() => {
    // Simple redirect to dashboard for now
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-sm text-gray-500 uppercase tracking-wider">Rythmiq</div>
        <h1 className="text-4xl font-bold text-blue-600">DocKit</h1>
        <p className="text-gray-600">Autonomous Document Intelligence</p>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
}
