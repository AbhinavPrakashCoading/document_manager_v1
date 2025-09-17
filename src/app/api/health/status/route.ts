import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/health/status
 * Simple health check endpoint to verify build is working
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: 'success',
    message: 'API routes are functioning correctly'
  })
}