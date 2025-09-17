import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ExamSchema } from '@/features/exam/examSchema'
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema'
import { DocumentRequirement } from '@/features/exam/types'
import toast from 'react-hot-toast'

interface UploadResult {
  success: boolean
  document?: {
    id: string
    filename: string
    documentType: string
    examType: string
  }
  archive?: {
    id: string
    fileHash: string
    fileSize: number
  }
  enhancementJob?: {
    id: string
    status: string
    enhancementType: string
  }
  error?: string
}

interface UseEnhancedUploadOptions {
  enableEnhancements?: boolean
  enhancementTypes?: string[]
  onUploadStart?: (file: File) => void
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string, file: File) => void
}

/**
 * Enhanced upload hook with storage protocol integration
 */
export function useEnhancedUpload(
  schema: ExamSchema,
  options: UseEnhancedUploadOptions = {}
) {
  const { data: session } = useSession()
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<Record<string, string[]>>({})
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadResults, setUploadResults] = useState<Record<string, UploadResult>>({})

  const {
    enableEnhancements = true,
    enhancementTypes = ['upscale', 'denoise', 'contrast'],
    onUploadStart,
    onUploadComplete,
    onUploadError
  } = options

  const getSchemaRequirements = useCallback((schema: ExamSchema): DocumentRequirement[] => {
    if (schema.requirements && Array.isArray(schema.requirements)) {
      return schema.requirements
    }

    if (schema.properties?.documents?.items?.properties?.type?.enum) {
      return schema.properties.documents.items.properties.type.enum.map(type => ({
        type,
        format: 'image/jpeg',
        maxSizeKB: 1024,
        dimensions: '200x200'
      }))
    }

    return [{
      type: 'document',
      format: 'image/jpeg',
      maxSizeKB: 1024,
      dimensions: '200x200'
    }]
  }, [])

  const requirements = getSchemaRequirements(schema)

  /**
   * Enhanced upload function that uses the new storage protocol
   */
  const uploadToStorageProtocol = useCallback(async (
    file: File,
    documentType: string,
    examType: string
  ): Promise<UploadResult> => {
    if (!session) {
      throw new Error('User not authenticated')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    formData.append('examType', examType)
    
    if (enableEnhancements) {
      formData.append('enhancementTypes', enhancementTypes.join(','))
    }

    const response = await fetch('/api/storage/documents/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    return result
  }, [session, enableEnhancements, enhancementTypes])

  /**
   * Handle file upload with storage protocol integration
   */
  const handleUpload = useCallback(async (file: File, documentType?: string) => {
    try {
      onUploadStart?.(file)
      setUploadingFiles(prev => new Set([...prev, file.name]))

      // Validate file first
      const normalizedName = file.name.toLowerCase().replace(/\s+/g, '')
      const errors: string[] = []

      const matchedReq = requirements.find((req) => {
        const normalizedType = req.type.toLowerCase().replace(/\s+/g, '')
        return normalizedName.includes(normalizedType) || documentType === req.type
      })

      if (matchedReq) {
        const validationResult = validateFileAgainstRequirement(file, matchedReq)
        if (!validationResult.valid && validationResult.errors) {
          errors.push(...validationResult.errors)
        }
      } else {
        errors.push(`No matching requirement found for ${file.name}`)
      }

      // Update validation results
      setFiles(prev => [...prev, file])
      setResults(prev => ({ ...prev, [file.name]: errors }))

      // If validation passed and user is authenticated, upload to storage protocol
      if (errors.length === 0 && session) {
        try {
          const uploadResult = await uploadToStorageProtocol(
            file,
            matchedReq?.type || documentType || 'document',
            schema.examId || 'unknown'
          )

          setUploadResults(prev => ({ ...prev, [file.name]: uploadResult }))
          onUploadComplete?.(uploadResult)

          if (uploadResult.enhancementJob) {
            toast.success(`✅ ${file.name} uploaded and queued for enhancement`)
          } else {
            toast.success(`✅ ${file.name} uploaded successfully`)
          }
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed'
          onUploadError?.(errorMessage, file)
          toast.error(`❌ Upload failed: ${errorMessage}`)
        }
      } else if (errors.length > 0) {
        toast.error(`❌ Validation failed for ${file.name}`)
      } else if (!session) {
        toast(`📝 ${file.name} validated (sign in to save permanently)`, { 
          icon: 'ℹ️',
          duration: 4000 
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Upload error:', error)
      setResults(prev => ({
        ...prev,
        [file.name]: [errorMessage]
      }))
      onUploadError?.(errorMessage, file)
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(file.name)
        return newSet
      })
    }
  }, [requirements, session, schema.examId, uploadToStorageProtocol, onUploadStart, onUploadComplete, onUploadError])

  /**
   * Create ZIP package from uploaded documents
   */
  const createZipPackage = useCallback(async (
    rollNumber?: string,
    usesMasters: boolean = true
  ) => {
    if (!session) {
      throw new Error('User not authenticated')
    }

    // Get successfully uploaded document IDs
    const documentIds = Object.values(uploadResults)
      .filter(result => result.success && result.document)
      .map(result => result.document!.id)

    if (documentIds.length === 0) {
      throw new Error('No documents available for ZIP creation')
    }

    const response = await fetch('/api/storage/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentIds,
        examType: schema.examId || 'unknown',
        rollNumber,
        usesMasters
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'ZIP creation failed')
    }

    return result.zip
  }, [session, uploadResults, schema.examId])

  /**
   * Get enhancement job status
   */
  const getEnhancementStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/storage/enhancement/${jobId}`)
    const result = await response.json()
    return result
  }, [])

  /**
   * Clear all uploaded files and results
   */
  const clearUploads = useCallback(() => {
    setFiles([])
    setResults({})
    setUploadResults({})
  }, [])

  const isUploading = uploadingFiles.size > 0
  const hasValidFiles = files.some(file => (results[file.name] || []).length === 0)
  const hasUploadedFiles = Object.keys(uploadResults).length > 0

  return {
    // File management
    files,
    results,
    uploadResults,
    requirements,
    
    // Upload functions
    handleUpload,
    createZipPackage,
    getEnhancementStatus,
    clearUploads,
    
    // Status
    isUploading,
    hasValidFiles,
    hasUploadedFiles,
    uploadingFiles: Array.from(uploadingFiles)
  }
}

// Backward compatibility export
export function useUpload(schema: ExamSchema) {
  return useEnhancedUpload(schema, { enableEnhancements: false })
}