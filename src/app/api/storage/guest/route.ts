import { NextRequest, NextResponse } from 'next/server'
import { documentStorageService } from '@/features/storage/DocumentStorageService'
import { guestStorageService } from '@/features/storage/GuestStorageService'

/**
 * POST /api/storage/guest/init
 * Initialize guest storage session
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = guestStorageService.generateGuestSession()
    const sessionInfo = await guestStorageService.initGuestSession(sessionId)

    return NextResponse.json({
      success: true,
      session: sessionInfo,
      message: 'Guest session initialized'
    })
  } catch (error) {
    console.error('Guest session init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize guest session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/storage/guest/[sessionId]
 * Get guest session info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const sessionInfo = await guestStorageService.getSessionInfo(sessionId)

    if (!sessionInfo) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session: sessionInfo
    })
  } catch (error) {
    console.error('Guest session info error:', error)
    return NextResponse.json(
      { error: 'Failed to get session info' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/storage/guest/[sessionId]
 * Clear guest session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    await guestStorageService.clearSession(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Guest session cleared'
    })
  } catch (error) {
    console.error('Guest session clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}