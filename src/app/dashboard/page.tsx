'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    console.log('Dashboard page - session status:', status)
    console.log('Dashboard page - session data:', session)
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <Dashboard />;
}