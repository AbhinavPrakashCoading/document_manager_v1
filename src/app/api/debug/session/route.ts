import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/debug/session
 * Debug endpoint to check current session state
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const sessionInfo = {
      hasSession: !!session,
      user: session?.user ? {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      } : null,
      expires: session?.expires,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Session check',
      session: sessionInfo
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Session check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}