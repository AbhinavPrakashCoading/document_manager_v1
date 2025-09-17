import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/storage/documents/list
 * Get user's documents list for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return mock data for now to ensure the Dashboard works
    const mockDocuments = [
      {
        id: '1',
        name: 'Sample Document 1.pdf',
        examType: 'IELTS',
        status: 'validated' as const,
        uploadDate: new Date().toISOString(),
        size: '2.5 MB',
        fileType: 'application/pdf',
        validationScore: 95,
        location: 'drive' as const,
        thumbnail: undefined,
        processingStage: undefined,
        downloadUrl: undefined,
        userId: session.user.email, // Use email as userId for now
        isProcessing: false
      },
      {
        id: '2',
        name: 'Sample Document 2.docx',
        examType: 'TOEFL',
        status: 'processing' as const,
        uploadDate: new Date().toISOString(),
        size: '1.8 MB',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        validationScore: undefined,
        location: 'local' as const,
        thumbnail: undefined,
        processingStage: 'analyzing',
        downloadUrl: undefined,
        userId: session.user.email, // Use email as userId for now
        isProcessing: true
      }
    ]

    return NextResponse.json(mockDocuments)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}