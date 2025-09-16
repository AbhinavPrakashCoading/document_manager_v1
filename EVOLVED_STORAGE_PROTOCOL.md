# Evolved Storage Protocol Documentation

## Overview

The Evolved Storage Protocol is a three-tier document storage and processing system designed for competitive exam document management. It provides:

1. **Archives** - Exact uploaded files for failsafe measures
2. **Masters** - AI/ML enhanced high-quality versions  
3. **Zips** - Schema-compliant packages for form submission

## Architecture

```
User Upload → Archive (Original) → Master (Enhanced) → ZIP (Schema Compliant)
     ↓             ↓                     ↓                    ↓
  Validation   Integrity Check    AI Enhancement      Form Submission
```

## Storage Layers

### 1. Archives Layer
- **Purpose**: Store exact files as uploaded by users
- **Features**:
  - Byte-perfect preservation
  - Multiple integrity checksums (SHA-256, MD5, SHA-1)
  - Original metadata preservation (EXIF, etc.)
  - Failsafe recovery capabilities

### 2. Masters Layer  
- **Purpose**: AI/ML enhanced versions with maximum detail
- **Features**:
  - AI upscaling (2x-4x resolution)
  - Noise reduction and sharpening
  - Contrast and color correction
  - OCR text extraction
  - Face detection and analysis
  - Document quality assessment

### 3. Zips Layer
- **Purpose**: Schema-compliant packages for exam submission
- **Features**:
  - Exam-specific formatting
  - Proper file naming conventions
  - Roll number integration
  - Validation compliance
  - Download tracking

## Database Schema

### Core Models

```sql
-- Main document record
Document {
  id: String (Primary Key)
  userId: String (Foreign Key → User)
  filename: String
  documentType: String (photo, certificate, etc.)
  examType: String (ssc, upsc, ielts)
  uploadDate: DateTime
  validationStatus: String
}

-- Archive storage (exact uploads)
DocumentArchive {
  id: String (Primary Key)
  documentId: String (Foreign Key → Document)
  fileHash: String (SHA-256)
  filePath: String
  fileSize: Int
  mimeType: String
  checksumMD5: String
  checksumSHA1: String
}

-- Master storage (AI enhanced)
DocumentMaster {
  id: String (Primary Key)
  documentId: String (Foreign Key → Document)
  enhancedWidth: Int
  enhancedHeight: Int
  qualityScore: Float (0-1)
  isUpscaled: Boolean
  isDenoised: Boolean
  textExtracted: String (OCR result)
  enhancementPipeline: String (JSON)
}

-- ZIP packages
DocumentZip {
  id: String (Primary Key)
  userId: String (Foreign Key → User)
  examType: String
  rollNumber: String
  fileHash: String
  validationPassed: Boolean
  downloadCount: Int
}

-- Enhancement processing queue
EnhancementJob {
  id: String (Primary Key)
  documentId: String
  status: String (pending, processing, completed, failed)
  enhancementType: String
  processingTime: Int
}
```

## AI/ML Enhancement Pipeline

### Free Tools Integration

1. **ESRGAN** - AI Super Resolution
   - 4x upscaling for photos
   - Preserves fine details
   - Installation: `git clone https://github.com/xinntao/ESRGAN.git`

2. **Sharp** - High-performance image processing
   - Denoising, sharpening, contrast adjustment
   - Built into Node.js ecosystem
   - Installation: `npm install sharp`

3. **Tesseract** - OCR text extraction
   - Multi-language support (English, Hindi)
   - Installation: `sudo apt-get install tesseract-ocr tesseract-ocr-hin`

4. **OpenCV** - Computer vision tasks
   - Face detection, document analysis
   - Installation: `pip install opencv-python`

5. **MediaPipe** - Google's ML framework
   - Advanced face detection and analysis
   - Installation: `pip install mediapipe`

### Cloud Free Tiers

- **Google Cloud Vision API**: 1,000 requests/month free
- **Azure Cognitive Services**: 5,000 transactions/month free
- **AWS Rekognition**: 5,000 images/month free (first year)

## API Endpoints

### Document Management

```typescript
// Upload with enhancement
POST /api/storage/documents
Content-Type: multipart/form-data
{
  file: File,
  documentType: string,
  examType: string,
  enhancementTypes: string // "upscale,denoise,ocr"
}

// List user documents  
GET /api/storage/documents?examType=ssc&limit=50&offset=0

// Get storage statistics
GET /api/storage/stats
```

### ZIP Package Management

```typescript
// Create ZIP package
POST /api/storage/zip
{
  documentIds: string[],
  examType: string,
  rollNumber?: string,
  usesMasters: boolean = true
}

// Download ZIP
GET /api/storage/zip/{id}

// List user ZIPs
GET /api/storage/zip?examType=upsc&limit=20
```

### Enhancement Pipeline

```typescript
// Check enhancement job status
GET /api/storage/enhancement/{jobId}

// Get enhancement queue stats
GET /api/storage/stats (includes enhancement pipeline status)
```

## Usage Examples

### Basic Upload with Enhancement

```typescript
import { useEnhancedUpload } from '@/features/upload/useEnhancedUpload'

const { handleUpload, createZipPackage } = useEnhancedUpload(schema, {
  enableEnhancements: true,
  enhancementTypes: ['upscale', 'denoise', 'contrast'],
  onUploadComplete: (result) => {
    console.log('Upload completed:', result)
    if (result.enhancementJob) {
      console.log('Enhancement job queued:', result.enhancementJob.id)
    }
  }
})

// Upload file
await handleUpload(file, 'photo')

// Create ZIP package
const zipPackage = await createZipPackage('ROLL123456', true)
```

### Manual Storage Protocol Usage

```typescript
import { storageService } from '@/features/storage/DocumentStorageService'

// Archive original file
const archive = await storageService.archiveDocument(
  documentId,
  file,
  originalFilename,
  metadata
)

// Create enhanced master
const enhancementJob = await storageService.createMaster(
  documentId,
  archive.id,
  ['upscale', 'denoise', 'ocr']
)

// Create ZIP package
const zipPackage = await storageService.createZipPackage(
  userId,
  [documentId],
  'ssc',
  'ROLL123456',
  true // use masters
)
```

## Migration Guide

### Database Migration

```bash
# Generate and run Prisma migration
npx prisma migrate dev --name "add-evolved-storage"
npx prisma generate
```

### Required Dependencies

```bash
# Core dependencies
npm install sharp jszip

# Optional ML tools (install as needed)
pip install opencv-python tesseract
sudo apt-get install tesseract-ocr tesseract-ocr-hin

# Optional: ESRGAN for advanced upscaling
git clone https://github.com/xinntao/ESRGAN.git
pip install torch torchvision torchaudio
```

### Directory Structure Setup

```bash
mkdir -p storage/{archives,masters,zips,temp}
chmod 755 storage storage/archives storage/masters storage/zips storage/temp
```

## Performance Considerations

### Storage Optimization

- **Archives**: Stored with maximum compression
- **Masters**: Balanced quality vs size (95% JPEG quality)
- **ZIPs**: Efficient packaging with deduplication

### Processing Queue

- **Priority Levels**: 1-10 (lower = higher priority)
- **Retry Logic**: Failed jobs retry up to 3 times
- **Background Processing**: Non-blocking enhancement pipeline
- **Resource Limits**: Configurable memory and time limits

### Caching Strategy

- **File Metadata**: Cached in database
- **Quality Scores**: Pre-computed and cached
- **ZIP Packages**: Generated on-demand, cached for 24 hours
- **Enhancement Results**: Permanent storage

## Security Features

### Data Protection

- **Encryption**: Files encrypted at rest (planned)
- **Access Control**: User-based file isolation
- **Integrity Checks**: Multiple checksum validation
- **Audit Logging**: Complete operation history

### Privacy Safeguards

- **Guest Mode**: No permanent storage for anonymous users
- **Data Retention**: Configurable retention periods
- **Secure Deletion**: Cryptographic wiping of deleted files
- **GDPR Compliance**: User data export and deletion

## Monitoring & Analytics

### Health Checks

```typescript
// System health status
GET /api/storage/health
{
  status: "healthy",
  checks: {
    database: true,
    storageDirectories: true,
    enhancementPipeline: true,
    diskSpace: 85
  }
}
```

### Usage Analytics

- Document upload trends
- Enhancement pipeline performance
- Storage usage by user/exam type
- Popular enhancement combinations
- ZIP download patterns

## Future Enhancements

### Planned Features

1. **Advanced AI Models**
   - Document type classification
   - Automatic quality assessment  
   - Content-aware enhancement

2. **Cloud Storage Integration**
   - AWS S3 / Google Cloud Storage
   - Multi-region replication
   - Disaster recovery

3. **Real-time Processing**
   - WebSocket status updates
   - Live enhancement progress
   - Instant ZIP generation

4. **Advanced Analytics**
   - ML-powered insights
   - User behavior analysis
   - Performance optimization

### Scalability Roadmap

1. **Horizontal Scaling**
   - Microservices architecture
   - Distributed processing queues
   - Load balancing

2. **Performance Optimization**
   - CDN integration
   - Edge computing
   - Progressive enhancement

This evolved storage protocol provides a robust, scalable foundation for document management in competitive exam workflows, with built-in AI enhancement capabilities and comprehensive data protection.