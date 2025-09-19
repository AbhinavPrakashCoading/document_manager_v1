import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { documentStorageService } from '@/features/storage/DocumentStorageService'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * POST /api/storage/zip
 * Create a schema-compliant ZIP package
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { documentIds, examType, rollNumber, usesMasters = true } = await request.json()

    if (!documentIds || !examType || !Array.isArray(documentIds)) {
      return NextResponse.json({ 
        error: 'Missing or invalid fields: documentIds (array), examType required' 
      }, { status: 400 })
    }

    // Verify user owns all documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        userId: user.id
      }
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ 
        error: 'Some documents not found or not accessible' 
      }, { status: 403 })
    }

    // Create ZIP package
    const zipPackage = await documentStorageService.createZipPackage(
      user.id,
      documentIds,
      examType,
      rollNumber,
      usesMasters
    )

    return NextResponse.json({
      success: true,
      zip: {
        id: zipPackage.id,
        filename: zipPackage.filename,
        fileSize: zipPackage.fileSize,
        examType: zipPackage.examType,
        rollNumber: zipPackage.rollNumber,
        includedDocuments: JSON.parse(zipPackage.includedDocuments),
        generatedAt: zipPackage.generatedAt
      }
    })

  } catch (error) {
    console.error('ZIP creation error:', error)
    return NextResponse.json({ 
      error: 'ZIP creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/storage/zip/[id]
 * Download a ZIP file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const zipRecord = await prisma.documentZip.findUnique({
      where: { 
        id: params.id,
        userId: user.id
      }
    })

    if (!zipRecord) {
      return NextResponse.json({ error: 'ZIP file not found' }, { status: 404 })
    }

    // Check if file exists
    const filePath = zipRecord.filePath
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: 'ZIP file no longer exists' }, { status: 410 })
    }

    // Update download count
    await prisma.documentZip.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } }
    })

    // Read file and return
    const fileBuffer = await fs.readFile(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipRecord.filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('ZIP download error:', error)
    return NextResponse.json({ 
      error: 'ZIP download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/storage/zip (list user's ZIP files)
 */
export async function GET_LIST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('examType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const zips = await prisma.documentZip.findMany({
      where: {
        userId: user.id,
        ...(examType && { examType })
      },
      select: {
        id: true,
        filename: true,
        fileSize: true,
        examType: true,
        rollNumber: true,
        generatedAt: true,
        downloadCount: true,
        validationPassed: true,
        schemaVersion: true
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.documentZip.count({
      where: {
        userId: user.id,
        ...(examType && { examType })
      }
    })

    return NextResponse.json({
      zips,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('ZIP list error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve ZIP files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/storage/zip/[id]
 * Delete a ZIP file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const zipRecord = await prisma.documentZip.findUnique({
      where: { 
        id: params.id,
        userId: user.id
      }
    })

    if (!zipRecord) {
      return NextResponse.json({ error: 'ZIP file not found' }, { status: 404 })
    }

    // Delete physical file
    try {
      await fs.unlink(zipRecord.filePath)
    } catch (error) {
      console.warn(`Failed to delete physical file ${zipRecord.filePath}:`, error)
    }

    // Delete database record
    await prisma.documentZip.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('ZIP deletion error:', error)
    return NextResponse.json({ 
      error: 'ZIP deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}