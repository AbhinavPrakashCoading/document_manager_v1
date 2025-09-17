import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug/db
 * Test database connectivity
 */
export async function GET(request: NextRequest) {
  try {
    // Simple test without importing prisma to avoid potential issues
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found'
      }, { status: 500 })
    }

    // For now, just return info about the DB URL without connecting
    const dbInfo = {
      hasUrl: !!dbUrl,
      urlType: dbUrl.includes('file:') ? 'sqlite' : 
               dbUrl.includes('postgresql:') ? 'postgresql' :
               dbUrl.includes('mysql:') ? 'mysql' : 'unknown',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database configuration check',
      database: dbInfo
    })
  } catch (error) {
    console.error('Debug database error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}