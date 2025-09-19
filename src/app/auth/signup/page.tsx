'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign Up - Temporarily Bypassed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Authentication system is being upgraded for production
          </p>
        </div>
        
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Redirecting to Dashboard...
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  The current auth system is being replaced with a production-ready solution.
                  You will be redirected to the dashboard in 2 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link 
            href="/dashboard"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Skip to Dashboard →
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            New auth system location: <code>/src/features/auth-v2/</code>
          </p>
        </div>
      </div>
    </div>
  )
}
