import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug/config
 * Debug endpoint to check server configuration
 */
export async function GET(request: NextRequest) {
  try {
    const config = {
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Server configuration check',
      config
    })
  } catch (error) {
    console.error('Debug config error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}