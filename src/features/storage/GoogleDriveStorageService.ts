import { google, drive_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Readable } from 'stream'
import { prisma } from '@/lib/prisma'

/**
 * Google Drive Storage Service
 * Handles file storage for logged-in users in their personal Drive
 */
export class GoogleDriveStorageService {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  /**
   * Initialize user's Drive storage with folder structure
   */
  async initializeUserDrive(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true,
        driveRootFolderId: true 
      }
    })

    if (!user?.googleDriveToken) {
      throw new Error('User has no Google Drive access token')
    }

    // Set up OAuth credentials
    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    // Create root folder if it doesn't exist
    if (!user.driveRootFolderId) {
      const rootFolder = await drive.files.create({
        requestBody: {
          name: 'ExamDoc Documents',
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Document storage for ExamDoc application'
        }
      })

      const rootFolderId = rootFolder.data.id!

      // Create subfolders
      const subfolders = ['Archives', 'Masters', 'ZIPs']
      for (const folderName of subfolders) {
        await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId]
          }
        })
      }

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: { driveRootFolderId: rootFolderId }
      })

      return rootFolderId
    }

    return user.driveRootFolderId
  }

  /**
   * Upload file to user's Drive
   */
  async uploadFile(
    userId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folderType: 'Archives' | 'Masters' | 'ZIPs'
  ): Promise<{ fileId: string; drivePath: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true,
        driveRootFolderId: true 
      }
    })

    if (!user?.googleDriveToken) {
      throw new Error('User has no Google Drive access token')
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    // Ensure user drive is initialized
    const rootFolderId = user.driveRootFolderId || await this.initializeUserDrive(userId)

    // Find the appropriate subfolder
    const folderQuery = `name='${folderType}' and parents in '${rootFolderId}' and mimeType='application/vnd.google-apps.folder'`
    const folderResponse = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)'
    })

    if (folderResponse.data.files?.length === 0) {
      throw new Error(`${folderType} folder not found`)
    }

    const folderId = folderResponse.data.files![0].id!

    // Create readable stream from buffer
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        description: `ExamDoc ${folderType.toLowerCase()} file uploaded on ${new Date().toISOString()}`
      },
      media: {
        mimeType,
        body: stream
      },
      fields: 'id, name, parents, size, createdTime'
    })

    if (!response.data.id) {
      throw new Error('Failed to upload file to Drive')
    }

    const drivePath = `ExamDoc Documents/${folderType}/${filename}`

    console.log(`✅ Uploaded to Drive: ${drivePath} (ID: ${response.data.id})`)

    return {
      fileId: response.data.id,
      drivePath
    }
  }

  /**
   * Download file from user's Drive
   */
  async downloadFile(
    userId: string,
    driveFileId: string
  ): Promise<{ buffer: Buffer; metadata: any }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true
      }
    })

    if (!user?.googleDriveToken) {
      throw new Error('User has no Google Drive access token')
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    // Get file metadata
    const metadataResponse = await drive.files.get({
      fileId: driveFileId,
      fields: 'id, name, size, mimeType, createdTime, modifiedTime'
    })

    // Download file content
    const response = await drive.files.get({
      fileId: driveFileId,
      alt: 'media'
    }, { responseType: 'stream' })

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      
      response.data.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      response.data.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve({
          buffer,
          metadata: metadataResponse.data
        })
      })

      response.data.on('error', reject)
    })
  }

  /**
   * Delete file from user's Drive
   */
  async deleteFile(userId: string, driveFileId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true
      }
    })

    if (!user?.googleDriveToken) {
      throw new Error('User has no Google Drive access token')
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    await drive.files.delete({
      fileId: driveFileId
    })

    console.log(`🗑️ Deleted from Drive: ${driveFileId}`)
  }

  /**
   * Check user's Drive quota
   */
  async getUserDriveQuota(userId: string): Promise<{
    limit: number
    usage: number
    usageInDrive: number
    available: number
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true
      }
    })

    if (!user?.googleDriveToken) {
      throw new Error('User has no Google Drive access token')
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    const response = await drive.about.get({
      fields: 'storageQuota'
    })

    const quota = response.data.storageQuota!

    return {
      limit: parseInt(quota.limit || '0'),
      usage: parseInt(quota.usage || '0'),
      usageInDrive: parseInt(quota.usageInDrive || '0'),
      available: parseInt(quota.limit || '0') - parseInt(quota.usage || '0')
    }
  }

  /**
   * List files in user's ExamDoc folder
   */
  async listUserFiles(
    userId: string,
    folderType?: 'Archives' | 'Masters' | 'ZIPs',
    limit: number = 100
  ): Promise<drive_v3.Schema$File[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleDriveToken: true, 
        googleDriveRefresh: true,
        driveRootFolderId: true
      }
    })

    if (!user?.googleDriveToken || !user.driveRootFolderId) {
      return []
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleDriveToken,
      refresh_token: user.googleDriveRefresh
    })

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    let query = `parents in '${user.driveRootFolderId}' and trashed=false`
    
    if (folderType) {
      const folderResponse = await drive.files.list({
        q: `name='${folderType}' and parents in '${user.driveRootFolderId}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id)'
      })
      
      if (folderResponse.data.files?.length > 0) {
        const folderId = folderResponse.data.files[0].id
        query = `parents in '${folderId}' and trashed=false`
      }
    }

    const response = await drive.files.list({
      q: query,
      pageSize: limit,
      fields: 'files(id, name, size, mimeType, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    })

    return response.data.files || []
  }

  /**
   * Get OAuth URL for Drive access
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass user ID in state parameter
      prompt: 'consent'
    })
  }

  /**
   * Handle OAuth callback
   */
  async handleAuthCallback(
    code: string, 
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain Drive tokens')
    }

    // Encrypt and store tokens (encryption to be implemented)
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveToken: tokens.access_token, // TODO: Encrypt
        googleDriveRefresh: tokens.refresh_token, // TODO: Encrypt
      }
    })

    // Initialize Drive folder structure
    await this.initializeUserDrive(userId)

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    }
  }

  /**
   * Refresh expired token
   */
  async refreshToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleDriveRefresh: true }
    })

    if (!user?.googleDriveRefresh) {
      throw new Error('No refresh token available')
    }

    this.oauth2Client.setCredentials({
      refresh_token: user.googleDriveRefresh
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh token')
    }

    // Update stored token (encrypt)
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveToken: credentials.access_token // TODO: Encrypt
      }
    })

    return credentials.access_token
  }
}

export const driveStorageService = new GoogleDriveStorageService()