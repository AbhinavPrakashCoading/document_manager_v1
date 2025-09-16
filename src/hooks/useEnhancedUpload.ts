'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface UploadProgress {
  stage: 'uploading' | 'archiving' | 'enhancing' | 'packaging' | 'completed' | 'error'
  progress: number
  message: string
}

export interface EnhancedUploadResult {
  success: boolean
  documentId?: string
  archiveId?: string
  masterId?: string
  zipId?: string
  storageType?: 'cloud' | 'local'
  error?: string
  downloadPath?: string // For guest users
}

export interface GuestSession {
  sessionId: string
  maxFileSize: number
  maxTotalStorage: number
  expiresAt: Date
}

export function useEnhancedUpload() {
  const { user } = useAuth()
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  /**
   * Initialize guest session for anonymous users
   */
  const initGuestSession = useCallback(async (): Promise<GuestSession> => {
    if (guestSession) {
      return guestSession
    }

    try {
      const response = await fetch('/api/storage/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize guest session')
      }

      const session = {
        ...data.session,
        expiresAt: new Date(data.session.expiresAt)
      }

      setGuestSession(session)
      
      // Store in localStorage for persistence
      localStorage.setItem('examdoc-guest-session', JSON.stringify(session))

      return session
    } catch (error) {
      console.error('Failed to initialize guest session:', error)
      throw error
    }
  }, [guestSession])

  /**
   * Load guest session from localStorage
   */
  const loadGuestSession = useCallback(() => {
    try {
      const stored = localStorage.getItem('examdoc-guest-session')
      if (stored) {
        const session = JSON.parse(stored)
        session.expiresAt = new Date(session.expiresAt)
        
        // Check if session is still valid
        if (session.expiresAt > new Date()) {
          setGuestSession(session)
          return session
        } else {
          // Session expired, remove it
          localStorage.removeItem('examdoc-guest-session')
        }
      }
    } catch (error) {
      console.error('Failed to load guest session:', error)
    }
    return null
  }, [])

  /**
   * Enhanced upload with cloud/local storage based on user auth
   */
  const uploadDocument = useCallback(async (
    file: File,
    examType: string,
    rollNumber?: string
  ): Promise<EnhancedUploadResult> => {
    setIsUploading(true)
    
    try {
      // Prepare for upload
      setUploadProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Preparing upload...'
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('examType', examType)
      
      if (rollNumber) {
        formData.append('rollNumber', rollNumber)
      }

      let endpoint = '/api/documents/upload'
      
      if (!user) {
        // Guest user - need session
        const session = guestSession || loadGuestSession() || await initGuestSession()
        formData.append('guestSessionId', session.sessionId)
        endpoint = '/api/documents/upload-guest'
      }

      // Stage 1: Upload and Archive
      setUploadProgress({
        stage: 'archiving',
        progress: 30,
        message: 'Archiving original document...'
      })

      const uploadResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Stage 2: AI/ML Enhancement
      setUploadProgress({
        stage: 'enhancing',
        progress: 60,
        message: 'Enhancing document with AI/ML...'
      })

      // Enhancement is handled automatically in the backend
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing time

      // Stage 3: Schema Packaging (optional)
      let zipResult = null
      if (examType !== 'general') {
        setUploadProgress({
          stage: 'packaging',
          progress: 90,
          message: 'Creating exam package...'
        })

        const zipEndpoint = user ? '/api/documents/create-zip' : '/api/documents/create-zip-guest'
        const zipResponse = await fetch(zipEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentIds: [uploadResult.documentId],
            examType,
            rollNumber,
            guestSessionId: !user ? guestSession?.sessionId : undefined
          })
        })

        if (zipResponse.ok) {
          zipResult = await zipResponse.json()
        }
      }

      // Stage 4: Complete
      setUploadProgress({
        stage: 'completed',
        progress: 100,
        message: 'Upload completed successfully!'
      })

      const result: EnhancedUploadResult = {
        success: true,
        documentId: uploadResult.documentId,
        archiveId: uploadResult.archiveId,
        masterId: uploadResult.masterId,
        storageType: uploadResult.storageType,
        zipId: zipResult?.zipId,
        downloadPath: zipResult?.downloadPath
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null)
      }, 3000)

      return result

    } catch (error) {
      console.error('Enhanced upload error:', error)
      
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    } finally {
      setIsUploading(false)
    }
  }, [user, guestSession, initGuestSession, loadGuestSession])

  /**
   * Create ZIP package from existing documents
   */
  const createZipPackage = useCallback(async (
    documentIds: string[],
    examType: string,
    rollNumber?: string
  ): Promise<EnhancedUploadResult> => {
    try {
      const endpoint = user ? '/api/documents/create-zip' : '/api/documents/create-zip-guest'
      
      const body: any = {
        documentIds,
        examType,
        rollNumber
      }

      if (!user && guestSession) {
        body.guestSessionId = guestSession.sessionId
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'ZIP creation failed')
      }

      return {
        success: true,
        zipId: result.zipId,
        storageType: result.storageType,
        downloadPath: result.downloadPath
      }

    } catch (error) {
      console.error('ZIP creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ZIP creation failed'
      }
    }
  }, [user, guestSession])

  /**
   * Clear guest session
   */
  const clearGuestSession = useCallback(async () => {
    if (guestSession) {
      try {
        await fetch(`/api/storage/guest/${guestSession.sessionId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Failed to clear guest session:', error)
      }
      
      setGuestSession(null)
      localStorage.removeItem('examdoc-guest-session')
    }
  }, [guestSession])

  return {
    uploadDocument,
    createZipPackage,
    uploadProgress,
    isUploading,
    guestSession,
    initGuestSession,
    loadGuestSession,
    clearGuestSession,
    isGuest: !user
  }
}