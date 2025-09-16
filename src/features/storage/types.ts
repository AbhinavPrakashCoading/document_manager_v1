// Types for the evolved storage protocol

export interface DocumentArchive {
  id: string
  documentId: string
  filename: string
  fileHash: string
  filePath: string
  fileSize: number
  mimeType: string
  metadata?: Record<string, any>
  checksumMD5?: string
  checksumSHA1?: string
  createdAt: Date
}

export interface DocumentMaster {
  id: string
  documentId: string
  filename: string
  filePath: string
  fileSize: number
  originalWidth?: number
  originalHeight?: number
  enhancedWidth?: number
  enhancedHeight?: number
  enhancementPipeline?: EnhancementStep[]
  qualityScore?: number
  processingTime?: number
  isUpscaled: boolean
  isDenoised: boolean
  isContrastAdjusted: boolean
  isSharpened: boolean
  isColorCorrected: boolean
  textExtracted?: string
  faceDetected: boolean
  documentAnalysis?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface DocumentZip {
  id: string
  documentId?: string
  userId: string
  examType: string
  filename: string
  filePath: string
  fileSize: number
  fileHash: string
  schemaVersion: string
  validationPassed: boolean
  includedDocuments: string[]
  rollNumber?: string
  generatedAt: Date
  expiresAt?: Date
  downloadCount: number
}

export interface EnhancementJob {
  id: string
  documentId: string
  archiveId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enhancementType: EnhancementType
  priority: number
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  retryCount: number
  processingTime?: number
  memoryUsed?: number
  createdAt: Date
  updatedAt: Date
}

// Enhancement pipeline types
export type EnhancementType = 
  | 'upscale' 
  | 'denoise' 
  | 'contrast' 
  | 'sharpen' 
  | 'color_correct'
  | 'ocr'
  | 'face_detection'
  | 'document_analysis'

export interface EnhancementStep {
  type: EnhancementType
  parameters: Record<string, any>
  toolUsed: string
  processingTime: number
  qualityImprovement?: number
  success: boolean
  error?: string
}

export interface EnhancementConfig {
  enableUpscaling: boolean
  enableDenoising: boolean
  enableOCR: boolean
  enableFaceDetection: boolean
  maxProcessingTime: number // in milliseconds
  qualityThreshold: number // 0-1 scale
  upscaleFactor: number // 2x, 4x etc
}

// Storage configuration
export interface StorageConfig {
  baseStoragePath: string
  archivePath: string
  masterPath: string
  zipPath: string
  tempPath: string
  maxFileSize: number
  supportedMimeTypes: string[]
  retentionDays: number
}

// Processing results
export interface ProcessingResult {
  success: boolean
  archive?: DocumentArchive
  master?: DocumentMaster
  zip?: DocumentZip
  errors: string[]
  warnings: string[]
  processingTime: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  averageProcessingTime: number
  totalJobs: number
}

// Free AI/ML Tool Integrations
export interface MLToolConfig {
  // ESRGAN for upscaling
  esrganEnabled: boolean
  esrganModelPath?: string
  
  // OpenCV for basic image processing
  opencvEnabled: boolean
  
  // Tesseract for OCR
  tesseractEnabled: boolean
  tesseractLanguages: string[]
  
  // Face detection models
  faceDetectionModel: 'opencv' | 'mediapipe' | 'face-api'
  
  // Document analysis
  documentAnalysisEnabled: boolean
  
  // Cloud services (with free tiers)
  googleVisionApiKey?: string
  azureCognitiveServicesKey?: string
  awsRekognitionEnabled: boolean
}

export const DEFAULT_ENHANCEMENT_CONFIG: EnhancementConfig = {
  enableUpscaling: true,
  enableDenoising: true,
  enableOCR: true,
  enableFaceDetection: true,
  maxProcessingTime: 30000, // 30 seconds
  qualityThreshold: 0.7,
  upscaleFactor: 2
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  baseStoragePath: './storage',
  archivePath: './storage/archives',
  masterPath: './storage/masters', 
  zipPath: './storage/zips',
  tempPath: './storage/temp',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/bmp',
    'application/pdf'
  ],
  retentionDays: 365
}

export const DEFAULT_ML_CONFIG: MLToolConfig = {
  esrganEnabled: true,
  opencvEnabled: true,
  tesseractEnabled: true,
  tesseractLanguages: ['eng', 'hin'],
  faceDetectionModel: 'opencv',
  documentAnalysisEnabled: true
}