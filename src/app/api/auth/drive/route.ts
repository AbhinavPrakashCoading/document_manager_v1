import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveStorageService } from '@/features/storage/GoogleDriveStorageService'
import { getServerSession } from 'next-auth'

const driveService = new GoogleDriveStorageService()

/**
 * GET /api/auth/drive/connect
 * Get Google Drive OAuth URL for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authUrl = driveService.getAuthUrl(session.user.id)

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to connect Google Drive'
    })
  } catch (error) {
    console.error('Drive connect error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Drive auth URL' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/drive/callback
 * Handle Google Drive OAuth callback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code required' },
        { status: 400 }
      )
    }

    // Handle OAuth callback and initialize Drive storage
    const { accessToken } = await driveService.handleAuthCallback(
      code, 
      session.user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Google Drive connected successfully',
      hasAccess: true
    })
  } catch (error) {
    console.error('Drive callback error:', error)
    return NextResponse.json(
      { error: 'Failed to connect Google Drive' },
      { status: 500 }
    )
  }
}