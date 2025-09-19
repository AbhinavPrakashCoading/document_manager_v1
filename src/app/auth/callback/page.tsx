'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function AuthCallbackContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('Auth callback debug page')
    console.log('Status:', status)
    console.log('Session:', session)
    
    // If we have a session, redirect to dashboard
    if (status === 'authenticated' && session) {
      console.log('Session found, redirecting to dashboard')
      router.push('/dashboard')
    }
    
    // If authentication failed or loading is done without session, go to sign-in
    if (status === 'unauthenticated') {
      console.log('No session, redirecting to sign-in')
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Sign-In</h1>
        
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Completing sign-in...</p>
          </>
        )}
        
        {status === 'authenticated' && (
          <>
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-gray-600">Sign-in successful! Redirecting...</p>
            <p className="text-sm text-gray-500 mt-2">Welcome, {session?.user?.email}</p>
          </>
        )}
        
        {status === 'unauthenticated' && (
          <>
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-gray-600">Sign-in failed. Redirecting to sign-in page...</p>
          </>
        )}
        
        <div className="mt-6 text-xs text-gray-400">
          <p>Status: {status}</p>
          <p>Session: {session ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackDebug() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}