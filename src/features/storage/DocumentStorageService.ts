import { prisma } from '@/lib/prisma'
import { DocumentEnhancementPipeline } from './DocumentEnhancementPipeline'
import { GoogleDriveStorageService } from './GoogleDriveStorageService'
import { GuestStorageService } from './GuestStorageService'
import { EncryptionService, ENCRYPTED_USER_FIELDS, ENCRYPTED_DOCUMENT_FIELDS, ENCRYPTED_ZIP_FIELDS } from './EncryptionService'

export interface DocumentUpload {
  buffer: Buffer
  filename: string
  mimeType: string
  size: number
}

export interface StorageResult {
  documentId: string
  archiveId?: string
  masterId?: string
  storageType: 'cloud' | 'local'
}

export interface ZipCreationResult {
  zipId: string
  filename: string
  size: number
  storageType: 'cloud' | 'local'
  downloadPath?: string // For guest users
}

/**
 * Cloud-First Document Storage Service
 * Manages three-tier storage with Google Drive for logged-in users
 * and local-only storage for guest users
 */
export class DocumentStorageService {
  private enhancementPipeline: DocumentEnhancementPipeline
  private driveService: GoogleDriveStorageService
  private guestService: GuestStorageService
  private encryptionService: EncryptionService

  constructor() {
    this.enhancementPipeline = new DocumentEnhancementPipeline()
    this.driveService = new GoogleDriveStorageService()
    this.guestService = new GuestStorageService()
    this.encryptionService = new EncryptionService()
  }

  /**
   * Archive uploaded document (Tier 3: Exact Copy)
   */
  async archiveDocument(
    upload: DocumentUpload, 
    userId?: string,
    guestSessionId?: string
  ): Promise<string> {
    console.log(`📦 Archiving document: ${upload.filename} (${upload.size} bytes)`)

    if (userId) {
      // Logged-in user: Store in Google Drive
      const { fileId, drivePath } = await this.driveService.uploadFile(
        userId,
        upload.buffer,
        upload.filename,
        upload.mimeType,
        'Archives'
      )

      // Create encrypted database record
      const archiveData = this.encryptionService.encryptFields({
        documentId: '', // Will be set after document creation
        filename: upload.filename,
        originalSize: upload.size,
        mimeType: upload.mimeType,
        driveFileId: fileId,
        drivePath: drivePath,
        storageType: 'cloud' as const
      }, ENCRYPTED_DOCUMENT_FIELDS)

      const archive = await prisma.documentArchive.create({
        data: {
          ...archiveData,
          user: { connect: { id: userId } }
        }
      })

      console.log(`☁️ Archive created in Drive: ${archive.id}`)
      return archive.id
    } else if (guestSessionId) {
      // Guest user: Store locally
      const { localPath, filename, size } = await this.guestService.storeFile(
        guestSessionId,
        upload.buffer,
        upload.filename,
        'archives'
      )

      // Store minimal session data (no database persistence)
      console.log(`🎭 Archive created locally: ${filename}`)
      return `local:${localPath}`
    } else {
      throw new Error('Either userId or guestSessionId must be provided')
    }
  }

  /**
   * Create enhanced master document (Tier 1: AI/ML Enhanced)
   */
  async createMaster(
    archiveId: string, 
    userId?: string,
    guestSessionId?: string
  ): Promise<string> {
    console.log(`🎯 Creating enhanced master from archive: ${archiveId}`)

    let sourceBuffer: Buffer
    let filename: string

    if (userId && !archiveId.startsWith('local:')) {
      // Get from database and Drive
      const archive = await prisma.documentArchive.findFirst({
        where: { id: archiveId, userId }
      })

      if (!archive?.driveFileId) {
        throw new Error('Archive not found or not accessible')
      }

      // Decrypt archive data
      const decryptedArchive = this.encryptionService.decryptFields(archive, ENCRYPTED_DOCUMENT_FIELDS)

      const { buffer } = await this.driveService.downloadFile(userId, archive.driveFileId)
      sourceBuffer = buffer
      filename = decryptedArchive.filename
    } else if (guestSessionId && archiveId.startsWith('local:')) {
      // Get from local storage
      const localPath = archiveId.replace('local:', '')
      const { buffer, filename: guestFilename } = await this.guestService.retrieveFile(guestSessionId, localPath)
      sourceBuffer = buffer
      filename = guestFilename
    } else {
      throw new Error('Invalid archive reference for user type')
    }

    // Enhance the document using AI/ML pipeline
    const enhanced = await this.enhancementPipeline.enhanceDocument(
      sourceBuffer, 
      filename
    )

    // Store enhanced version
    if (userId) {
      // Store enhanced in Google Drive
      const { fileId, drivePath } = await this.driveService.uploadFile(
        userId,
        enhanced.enhancedBuffer,
        `enhanced_${enhanced.filename}`,
        enhanced.mimeType,
        'Masters'
      )

      // Create encrypted database record
      const masterData = this.encryptionService.encryptFields({
        documentId: '', // Will be set after document creation
        filename: enhanced.filename,
        enhancedSize: enhanced.enhancedBuffer.length,
        originalSize: sourceBuffer.length,
        mimeType: enhanced.mimeType,
        enhancementType: enhanced.enhancementType,
        qualityImprovement: enhanced.qualityScore,
        textExtracted: enhanced.textContent,
        faceDetected: enhanced.faceDetected,
        documentAnalysis: JSON.stringify(enhanced.analysis),
        driveFileId: fileId,
        drivePath: drivePath,
        storageType: 'cloud' as const
      }, ENCRYPTED_DOCUMENT_FIELDS)

      const master = await prisma.documentMaster.create({
        data: {
          ...masterData,
          user: { connect: { id: userId } }
        }
      })

      console.log(`☁️ Master created in Drive: ${master.id}`)
      return master.id
    } else if (guestSessionId) {
      // Store enhanced locally
      const { localPath } = await this.guestService.storeFile(
        guestSessionId,
        enhanced.enhancedBuffer,
        `enhanced_${enhanced.filename}`,
        'masters'
      )

      console.log(`🎭 Master created locally: enhanced_${enhanced.filename}`)
      return `local:${localPath}`
    } else {
      throw new Error('Either userId or guestSessionId must be provided')
    }
  }

  /**
   * Create schema-compliant ZIP package (Tier 2: Ready for Submission)
   */
  async createZipPackage(
    documentIds: string[],
    examType: string,
    rollNumber?: string,
    userId?: string,
    guestSessionId?: string
  ): Promise<ZipCreationResult> {
    console.log(`📦 Creating ZIP package for exam: ${examType}`)

    const JSZip = require('jszip')
    const zip = new JSZip()

    // Get schema for exam type
    const schemaPath = `./src/schemas/${examType.toLowerCase()}.json`
    let schema: any
    try {
      const schemaContent = await import(schemaPath)
      schema = schemaContent.default
    } catch (error) {
      throw new Error(`Schema not found for exam type: ${examType}`)
    }

    // Collect documents based on storage type
    const documents = []
    
    for (const docId of documentIds) {
      if (userId && !docId.startsWith('local:')) {
        // Get from database
        const doc = await prisma.document.findFirst({
          where: { id: docId, userId },
          include: { master: true }
        })

        if (doc?.master?.driveFileId) {
          const { buffer } = await this.driveService.downloadFile(userId, doc.master.driveFileId)
          const decryptedMaster = this.encryptionService.decryptFields(doc.master, ENCRYPTED_DOCUMENT_FIELDS)
          
          zip.file(decryptedMaster.filename, buffer)
          documents.push({
            id: docId,
            filename: decryptedMaster.filename,
            size: buffer.length
          })
        }
      } else if (guestSessionId && docId.startsWith('local:')) {
        // Get from local storage
        const localPath = docId.replace('local:', '')
        const { buffer, filename } = await this.guestService.retrieveFile(guestSessionId, localPath)
        
        zip.file(filename, buffer)
        documents.push({
          id: docId,
          filename,
          size: buffer.length
        })
      }
    }

    // Add schema file
    zip.file(`${examType.toLowerCase()}_schema.json`, JSON.stringify(schema, null, 2))

    // Add metadata
    const metadata = {
      examType,
      rollNumber: rollNumber || 'guest',
      documentsIncluded: documents.length,
      createdAt: new Date().toISOString(),
      schemaVersion: schema.version || '1.0'
    }
    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipFilename = `${examType}_${rollNumber || 'guest'}_${Date.now()}.zip`

    // Store ZIP based on user type
    if (userId) {
      // Store in Google Drive
      const { fileId, drivePath } = await this.driveService.uploadFile(
        userId,
        zipBuffer,
        zipFilename,
        'application/zip',
        'ZIPs'
      )

      // Create encrypted database record
      const zipData = this.encryptionService.encryptFields({
        filename: zipFilename,
        size: zipBuffer.length,
        examType,
        includedDocuments: JSON.stringify(documents),
        rollNumber: rollNumber || null,
        driveFileId: fileId,
        drivePath: drivePath,
        storageType: 'cloud' as const
      }, ENCRYPTED_ZIP_FIELDS)

      const zipRecord = await prisma.documentZip.create({
        data: {
          ...zipData,
          user: { connect: { id: userId } }
        }
      })

      console.log(`☁️ ZIP package created in Drive: ${zipRecord.id}`)

      return {
        zipId: zipRecord.id,
        filename: zipFilename,
        size: zipBuffer.length,
        storageType: 'cloud'
      }
    } else if (guestSessionId) {
      // Store locally
      const { localPath } = await this.guestService.storeFile(
        guestSessionId,
        zipBuffer,
        zipFilename,
        'zips'
      )

      console.log(`🎭 ZIP package created locally: ${zipFilename}`)

      return {
        zipId: `local:${localPath}`,
        filename: zipFilename,
        size: zipBuffer.length,
        storageType: 'local',
        downloadPath: localPath
      }
    } else {
      throw new Error('Either userId or guestSessionId must be provided')
    }
  }

  /**
   * Complete document processing workflow
   */
  async processDocument(
    upload: DocumentUpload,
    examType: string,
    rollNumber?: string,
    userId?: string,
    guestSessionId?: string
  ): Promise<StorageResult> {
    console.log(`🚀 Processing document workflow: ${upload.filename}`)

    // Step 1: Archive original
    const archiveId = await this.archiveDocument(upload, userId, guestSessionId)

    // Step 2: Create enhanced master
    const masterId = await this.createMaster(archiveId, userId, guestSessionId)

    // Step 3: Create document record
    let documentId: string

    if (userId) {
      const document = await prisma.document.create({
        data: {
          filename: upload.filename,
          size: upload.size,
          mimeType: upload.mimeType,
          examType,
          user: { connect: { id: userId } }
        }
      })

      // Update archive and master with document ID
      await prisma.documentArchive.update({
        where: { id: archiveId },
        data: { documentId: document.id }
      })

      if (masterId && !masterId.startsWith('local:')) {
        await prisma.documentMaster.update({
          where: { id: masterId },
          data: { documentId: document.id }
        })
      }

      documentId = document.id
    } else {
      // For guests, use the local path as ID
      documentId = `local:${guestSessionId}`
    }

    console.log(`✅ Document processing complete: ${documentId}`)

    return {
      documentId,
      archiveId,
      masterId,
      storageType: userId ? 'cloud' : 'local'
    }
  }

  /**
   * Get user's storage quota (Drive users only)
   */
  async getUserStorageInfo(userId: string) {
    const quota = await this.driveService.getUserDriveQuota(userId)
    
    const userDocuments = await prisma.document.count({
      where: { userId }
    })

    return {
      ...quota,
      documentsStored: userDocuments
    }
  }

  /**
   * List user's documents
   */
  async listUserDocuments(userId: string, limit = 50) {
    const documents = await prisma.document.findMany({
      where: { userId },
      include: {
        archive: true,
        master: true,
        zipPackages: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Decrypt sensitive fields
    return documents.map(doc => ({
      ...doc,
      archive: doc.archive ? this.encryptionService.decryptFields(doc.archive, ENCRYPTED_DOCUMENT_FIELDS) : null,
      master: doc.master ? this.encryptionService.decryptFields(doc.master, ENCRYPTED_DOCUMENT_FIELDS) : null
    }))
  }

  /**
   * Delete document and all associated files
   */
  async deleteDocument(documentId: string, userId?: string, guestSessionId?: string): Promise<void> {
    if (userId) {
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
        include: { archive: true, master: true, zipPackages: true }
      })

      if (!document) {
        throw new Error('Document not found')
      }

      // Delete from Drive
      if (document.archive?.driveFileId) {
        await this.driveService.deleteFile(userId, document.archive.driveFileId)
      }
      
      if (document.master?.driveFileId) {
        await this.driveService.deleteFile(userId, document.master.driveFileId)
      }

      // Delete ZIP packages
      for (const zip of document.zipPackages) {
        if (zip.driveFileId) {
          await this.driveService.deleteFile(userId, zip.driveFileId)
        }
      }

      // Delete database records
      await prisma.document.delete({ where: { id: documentId } })

      console.log(`🗑️ Document deleted: ${documentId}`)
    } else if (guestSessionId) {
      // For guest users, just clear the session
      await this.guestService.clearSession(guestSessionId)
      console.log(`🎭 Guest session cleared: ${guestSessionId}`)
    }
  }

  /**
   * Get user documents for dashboard display
   * Returns formatted document data suitable for dashboard
   */
  async getUserDocuments(
    userId?: string, 
    guestSessionId?: string, 
    limit = 10
  ): Promise<Array<{
    id: string;
    name: string;
    examType: string;
    status: 'validated' | 'processing' | 'failed' | 'pending' | 'enhancing';
    uploadDate: string;
    size: string;
    validationScore?: number;
    location: 'drive' | 'local';
    processingStage?: string;
  }>> {
    const documents = []

    if (userId) {
      // Get documents from database for authenticated users
      const userDocs = await prisma.document.findMany({
        where: { userId },
        orderBy: { uploadDate: 'desc' },
        take: limit
      })
      
      for (const doc of userDocs) {
        documents.push({
          id: doc.id,
          name: doc.filename,
          examType: doc.examType,
          status: (doc.validationStatus === 'valid' ? 'validated' : 'pending') as 'validated' | 'processing' | 'failed' | 'pending' | 'enhancing',
          uploadDate: doc.uploadDate.toISOString().split('T')[0],
          size: `${Math.round(doc.fileSize / 1024)} KB`,
          validationScore: doc.validationStatus === 'valid' ? 95 : undefined,
          location: 'drive' as const,
          processingStage: doc.validationStatus === 'pending' ? 'Processing...' : undefined
        })
      }
    } else if (guestSessionId) {
      // For guest users, we don't have persistent storage
      // This would be implemented when we add guest document tracking
      // For now, return empty array as guest docs are session-only
    }

    return documents
  }
}

export const documentStorageService = new DocumentStorageService()