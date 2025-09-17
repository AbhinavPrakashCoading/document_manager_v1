import { NextRequest, NextResponse } from 'next/server'
// Temporarily disabled auth while auth system is being rebuilt
// import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/lib/auth'

/**
 * GET /api/storage/stats/user
 * Get user's storage statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass auth while auth system is being rebuilt
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Return mock data for now
    const mockStats = {
      totalDocuments: 3,
      storageUsed: 7.5, // MB (2.5 + 1.8 + 3.2)
      storageLimit: 1024, // MB
      driveConnected: true,
      processingCount: 1 // One document is processing
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