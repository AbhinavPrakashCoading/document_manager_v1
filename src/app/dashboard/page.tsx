'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { DraftsList } from '@/components/draft/DraftsList';
import {
  ChevronRight,
  Upload,
  Shield,
  FileText,
  User,
  LogOut,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      // In guest mode, just redirect to home
      window.location.href = '/';
    }
  };

  const getUserName = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ')[0];
    }
    return 'Guest'; // Changed from 'User' to 'Guest' when no auth
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Welcome, {getUserName()}!</h1>
              {session?.user?.email ? (
                <p className="text-sm text-gray-600">{session.user.email}</p>
              ) : (
                <p className="text-sm text-gray-600">Testing mode - Authentication disabled</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Document Manager</h2>
              <p className="text-blue-100">Built for UPSC, SSC, and IELTS workflows</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
          <Link
            href="/select"
            className="inline-flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            <span>Start New Application</span>
          </Link>
        </div>

        {/* Drafts Section */}
        <DraftsList />

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/select"
              className="flex flex-col items-center space-y-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">New Application</h4>
                <p className="text-xs text-gray-600">Start document processing</p>
              </div>
            </Link>
            <Link
              href="/confirm"
              className="flex flex-col items-center space-y-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">Validate</h4>
                <p className="text-xs text-gray-600">Check document status</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Supported Exams */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Supported Exams</h3>
            <div className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              3 Active
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'UPSC', desc: 'Union Public Service Commission', color: 'bg-red-500' },
              { name: 'SSC', desc: 'Staff Selection Commission', color: 'bg-blue-500' },
              { name: 'IELTS', desc: 'International English Testing', color: 'bg-green-500' }
            ].map((exam, index) => (
              <Link
                key={index}
                href={`/select?exam=${exam.name.toLowerCase()}`}
                className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className={`w-10 h-10 ${exam.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{exam.name.slice(0, 2)}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{exam.name}</h4>
                  <p className="text-sm text-gray-600">{exam.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Auto-save Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Auto-Save Enabled</h4>
          </div>
          <p className="text-sm text-green-700">
            Your progress is automatically saved every few seconds. No need to worry about losing your work!
          </p>
        </div>
      </div>
    </div>
  );
}