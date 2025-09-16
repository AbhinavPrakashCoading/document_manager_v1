import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import os from 'os'

/**
 * Guest Storage Handler - Local-only storage for anonymous users
 * No server persistence, all data lives in browser + temporary local files
 */
export class GuestStorageService {
  private readonly tempDir: string
  private readonly maxFileSize = 50 * 1024 * 1024 // 50MB per file
  private readonly maxTotalStorage = 200 * 1024 * 1024 // 200MB total per guest
  private readonly sessionTimeout = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    // Use system temp directory with unique app prefix
    this.tempDir = path.join(os.tmpdir(), 'examdoc-guest')
    this.ensureTempDir()
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  /**
   * Generate a secure session ID for guest user
   */
  generateGuestSession(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Get guest session directory
   */
  private getGuestDir(sessionId: string): string {
    return path.join(this.tempDir, sessionId)
  }

  /**
   * Initialize guest storage session
   */
  async initGuestSession(sessionId: string): Promise<{
    sessionId: string
    maxFileSize: number
    maxTotalStorage: number
    expiresAt: Date
  }> {
    const guestDir = this.getGuestDir(sessionId)
    
    // Create session directory structure
    await fs.mkdir(guestDir, { recursive: true })
    await fs.mkdir(path.join(guestDir, 'archives'), { recursive: true })
    await fs.mkdir(path.join(guestDir, 'masters'), { recursive: true })
    await fs.mkdir(path.join(guestDir, 'zips'), { recursive: true })

    // Create session metadata
    const sessionMeta = {
      sessionId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
      storageUsed: 0
    }

    await fs.writeFile(
      path.join(guestDir, 'session.json'),
      JSON.stringify(sessionMeta, null, 2)
    )

    console.log(`🎭 Guest session initialized: ${sessionId}`)

    return {
      sessionId,
      maxFileSize: this.maxFileSize,
      maxTotalStorage: this.maxTotalStorage,
      expiresAt: new Date(sessionMeta.expiresAt)
    }
  }

  /**
   * Store file in guest session
   */
  async storeFile(
    sessionId: string,
    buffer: Buffer,
    filename: string,
    folderType: 'archives' | 'masters' | 'zips'
  ): Promise<{
    localPath: string
    filename: string
    size: number
    storedAt: Date
  }> {
    const guestDir = this.getGuestDir(sessionId)
    
    // Check if session exists and is valid
    const sessionValid = await this.validateSession(sessionId)
    if (!sessionValid) {
      throw new Error('Guest session expired or invalid')
    }

    // Check file size limits
    if (buffer.length > this.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`)
    }

    // Check total storage usage
    const currentUsage = await this.getStorageUsage(sessionId)
    if (currentUsage + buffer.length > this.maxTotalStorage) {
      throw new Error(`Storage quota exceeded. Available: ${(this.maxTotalStorage - currentUsage) / (1024 * 1024)}MB`)
    }

    // Generate unique filename to prevent conflicts
    const fileId = crypto.randomBytes(8).toString('hex')
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storedFilename = `${fileId}_${safeName}`
    
    const localPath = path.join(guestDir, folderType, storedFilename)

    // Store the file
    await fs.writeFile(localPath, buffer)

    // Update session metadata
    await this.updateStorageUsage(sessionId, buffer.length)

    console.log(`💾 Guest file stored: ${folderType}/${storedFilename} (${buffer.length} bytes)`)

    return {
      localPath,
      filename: storedFilename,
      size: buffer.length,
      storedAt: new Date()
    }
  }

  /**
   * Retrieve file from guest session
   */
  async retrieveFile(
    sessionId: string,
    localPath: string
  ): Promise<{
    buffer: Buffer
    filename: string
    size: number
  }> {
    // Validate session
    const sessionValid = await this.validateSession(sessionId)
    if (!sessionValid) {
      throw new Error('Guest session expired or invalid')
    }

    // Ensure path is within guest directory (security check)
    const guestDir = this.getGuestDir(sessionId)
    const resolvedPath = path.resolve(localPath)
    const resolvedGuestDir = path.resolve(guestDir)
    
    if (!resolvedPath.startsWith(resolvedGuestDir)) {
      throw new Error('Invalid file path')
    }

    try {
      const buffer = await fs.readFile(localPath)
      const filename = path.basename(localPath)
      
      return {
        buffer,
        filename,
        size: buffer.length
      }
    } catch (error) {
      throw new Error('File not found or inaccessible')
    }
  }

  /**
   * List files in guest session
   */
  async listFiles(
    sessionId: string,
    folderType?: 'archives' | 'masters' | 'zips'
  ): Promise<Array<{
    filename: string
    localPath: string
    size: number
    modifiedAt: Date
    folderType: string
  }>> {
    const sessionValid = await this.validateSession(sessionId)
    if (!sessionValid) {
      return []
    }

    const guestDir = this.getGuestDir(sessionId)
    const files: Array<{
      filename: string
      localPath: string
      size: number
      modifiedAt: Date
      folderType: string
    }> = []

    const foldersToCheck = folderType ? [folderType] : ['archives', 'masters', 'zips']

    for (const folder of foldersToCheck) {
      const folderPath = path.join(guestDir, folder)
      
      try {
        const entries = await fs.readdir(folderPath, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.isFile()) {
            const filePath = path.join(folderPath, entry.name)
            const stats = await fs.stat(filePath)
            
            files.push({
              filename: entry.name,
              localPath: filePath,
              size: stats.size,
              modifiedAt: stats.mtime,
              folderType: folder
            })
          }
        }
      } catch (error) {
        // Folder doesn't exist or can't be read - continue
      }
    }

    return files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }

  /**
   * Delete file from guest session
   */
  async deleteFile(sessionId: string, localPath: string): Promise<void> {
    const sessionValid = await this.validateSession(sessionId)
    if (!sessionValid) {
      throw new Error('Guest session expired or invalid')
    }

    // Security check - ensure path is within guest directory
    const guestDir = this.getGuestDir(sessionId)
    const resolvedPath = path.resolve(localPath)
    const resolvedGuestDir = path.resolve(guestDir)
    
    if (!resolvedPath.startsWith(resolvedGuestDir)) {
      throw new Error('Invalid file path')
    }

    try {
      const stats = await fs.stat(localPath)
      await fs.unlink(localPath)
      
      // Update storage usage
      await this.updateStorageUsage(sessionId, -stats.size)
      
      console.log(`🗑️ Guest file deleted: ${path.basename(localPath)}`)
    } catch (error) {
      // File might already be deleted - ignore
    }
  }

  /**
   * Clean up expired guest sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessions = await fs.readdir(this.tempDir, { withFileTypes: true })
      let cleanedCount = 0

      for (const session of sessions) {
        if (session.isDirectory()) {
          const sessionPath = path.join(this.tempDir, session.name)
          const metaPath = path.join(sessionPath, 'session.json')

          try {
            const metaContent = await fs.readFile(metaPath, 'utf-8')
            const metadata = JSON.parse(metaContent)
            
            const expiresAt = new Date(metadata.expiresAt)
            if (expiresAt < new Date()) {
              // Session expired - clean it up
              await fs.rm(sessionPath, { recursive: true, force: true })
              cleanedCount++
              console.log(`🧹 Cleaned up expired guest session: ${session.name}`)
            }
          } catch (error) {
            // Invalid session metadata - clean it up
            await fs.rm(sessionPath, { recursive: true, force: true })
            cleanedCount++
          }
        }
      }

      return cleanedCount
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return 0
    }
  }

  /**
   * Get storage usage for guest session
   */
  async getStorageUsage(sessionId: string): Promise<number> {
    try {
      const guestDir = this.getGuestDir(sessionId)
      const metaPath = path.join(guestDir, 'session.json')
      
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const metadata = JSON.parse(metaContent)
      
      return metadata.storageUsed || 0
    } catch {
      return 0
    }
  }

  /**
   * Validate guest session
   */
  private async validateSession(sessionId: string): Promise<boolean> {
    try {
      const guestDir = this.getGuestDir(sessionId)
      const metaPath = path.join(guestDir, 'session.json')
      
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const metadata = JSON.parse(metaContent)
      
      const expiresAt = new Date(metadata.expiresAt)
      return expiresAt > new Date()
    } catch {
      return false
    }
  }

  /**
   * Update storage usage in session metadata
   */
  private async updateStorageUsage(sessionId: string, deltaBytes: number): Promise<void> {
    try {
      const guestDir = this.getGuestDir(sessionId)
      const metaPath = path.join(guestDir, 'session.json')
      
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const metadata = JSON.parse(metaContent)
      
      metadata.storageUsed = (metadata.storageUsed || 0) + deltaBytes
      metadata.lastUpdated = new Date().toISOString()
      
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2))
    } catch (error) {
      console.error('Failed to update storage usage:', error)
    }
  }

  /**
   * Clear all guest session data
   */
  async clearSession(sessionId: string): Promise<void> {
    const guestDir = this.getGuestDir(sessionId)
    
    try {
      await fs.rm(guestDir, { recursive: true, force: true })
      console.log(`🎭 Guest session cleared: ${sessionId}`)
    } catch (error) {
      console.error(`Failed to clear guest session ${sessionId}:`, error)
    }
  }

  /**
   * Get session info
   */
  async getSessionInfo(sessionId: string): Promise<{
    sessionId: string
    createdAt: Date
    expiresAt: Date
    storageUsed: number
    maxStorage: number
    isValid: boolean
  } | null> {
    try {
      const guestDir = this.getGuestDir(sessionId)
      const metaPath = path.join(guestDir, 'session.json')
      
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const metadata = JSON.parse(metaContent)
      
      const expiresAt = new Date(metadata.expiresAt)
      
      return {
        sessionId,
        createdAt: new Date(metadata.createdAt),
        expiresAt,
        storageUsed: metadata.storageUsed || 0,
        maxStorage: this.maxTotalStorage,
        isValid: expiresAt > new Date()
      }
    } catch {
      return null
    }
  }
}

export const guestStorageService = new GuestStorageService()