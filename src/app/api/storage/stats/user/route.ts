import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/storage/stats/user
 * Get user's storage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return mock data for now
    const mockStats = {
      totalDocuments: 12,
      storageUsed: 45.6, // MB
      storageLimit: 1024, // MB
      driveConnected: true,
      processingCount: 2
    }

    return NextResponse.json(mockStats)
  } catch (error) {
    console.error('Error fetching storage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage stats' },
      { status: 500 }
    )
  }
}