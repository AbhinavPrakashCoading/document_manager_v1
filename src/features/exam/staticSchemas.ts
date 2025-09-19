import { ExamSchema } from '@/features/exam/examSchema';

export const staticSchemas: Record<string, ExamSchema> = {
  'ielts': {
    examId: 'ielts',
    examName: 'IELTS',
    version: '2024.1.0',
    lastUpdated: new Date('2024-01-15'),
    requirements: [
      {
        id: 'photo',
        type: 'Photo',
        displayName: 'Passport Style Photo',
        description: 'Recent passport-style photograph',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        aliases: ['passport photo', 'photograph', 'photo'],
        category: 'photo',
        mandatory: true,
        subjective: [
          {
            field: 'photo',
            requirement: 'Recent photograph taken within last 6 months',
            context: 'For identification purposes during test',
            confidence: 0.9,
            source: 'form',
            priority: 'high'
          }
        ],
        validationRules: [
          {
            type: 'strict',
            rule: 'file_size_limit',
            message: 'Photo file size must not exceed 100KB',
            field: 'photo',
            canOverride: false
          },
          {
            type: 'soft',
            rule: 'photo_quality',
            message: 'Ensure photo is clear and well-lit',
            field: 'photo',
            canOverride: true
          }
        ],
        examples: ['Clear passport photo with white background'],
        commonMistakes: ['Selfies', 'Dark photos', 'Wrong size'],
        helpText: 'Upload a recent passport-style photo with white background'
      },
      {
        id: 'id',
        type: 'ID',
        displayName: 'Identity Document',
        description: 'Government-issued identity proof',
        format: 'PDF',
        maxSizeKB: 1024,
        category: 'identity',
        mandatory: true,
        aliases: ['identity', 'id proof', 'government id'],
        subjective: [
          {
            field: 'id',
            requirement: 'Valid government-issued ID',
            context: 'Must be current and not expired',
            confidence: 0.95,
            source: 'guidelines',
            priority: 'high'
          }
        ],
        validationRules: [
          {
            type: 'strict',
            rule: 'file_size_limit',
            message: 'ID file size must not exceed 1MB',
            field: 'id',
            canOverride: false
          }
        ],
        examples: ['Passport', 'Driver\'s License', 'National ID'],
        commonMistakes: ['Expired ID', 'Low quality scan'],
        helpText: 'Upload a clear scan of your valid government ID'
      }
    ],
    generalGuidelines: [
      'All documents must be clear and legible',
      'Follow the specified format requirements',
      'Ensure all documents are current and valid'
    ],
    scrapingMetadata: {
      sources: ['form', 'guidelines'],
      confidence: 0.9,
      lastScrapeAttempt: new Date('2024-01-15'),
      scrapeSuccess: true,
      errorCount: 0
    },
    configuration: {
      examType: 'IELTS',
      baseUrl: 'https://ielts.org',
      formUrls: ['https://ielts.org/book-a-test'],
      faqUrls: ['https://ielts.org/faqs'],
      guidelineUrls: ['https://ielts.org/guidelines'],
      updateFrequency: 'monthly',
      priority: 1
    },
    stats: {
      totalDocuments: 2,
      mandatoryDocuments: 2,
      avgConfidenceScore: 0.92,
      subjectiveRequirements: 2
    }
  },
  'ssc': {
    examId: 'ssc',
    examName: 'Staff Selection Commission',
    version: '2024.1.0',
    lastUpdated: new Date('2024-01-15'),
    requirements: [
      {
        id: 'photo',
        type: 'Photo',
        displayName: 'Recent Photograph',
        description: 'Recent passport size photograph',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        aliases: ['passport photo', 'photograph', 'photo'],
        category: 'photo',
        mandatory: true,
        subjective: [
          {
            field: 'photo',
            requirement: 'Recent passport size photograph',
            context: 'For identification during exam',
            confidence: 0.9,
            source: 'form',
            priority: 'high'
          }
        ],
        validationRules: [
          {
            type: 'strict',
            rule: 'file_size_limit',
            message: 'Photo file size must not exceed 100KB',
            field: 'photo',
            canOverride: false
          }
        ],
        examples: ['Clear passport photo with white background'],
        commonMistakes: ['Selfies', 'Blurry photos'],
        helpText: 'Upload a recent passport size photo'
      },
      {
        id: 'signature',
        type: 'Signature',
        displayName: 'Digital Signature',
        description: 'Scanned signature image',
        format: 'JPEG',
        maxSizeKB: 50,
        dimensions: '300x80',
        aliases: ['signature', 'sign'],
        category: 'signature',
        mandatory: true,
        subjective: [
          {
            field: 'signature',
            requirement: 'Clear signature in black ink',
            context: 'For verification purposes',
            confidence: 0.9,
            source: 'guidelines',
            priority: 'high'
          }
        ],
        validationRules: [
          {
            type: 'strict',
            rule: 'file_size_limit',
            message: 'Signature file size must not exceed 50KB',
            field: 'signature',
            canOverride: false
          }
        ],
        examples: ['Clear black ink signature'],
        commonMistakes: ['Pencil signature', 'Blurry scan'],
        helpText: 'Upload a clear scanned signature in black ink'
      }
    ],
    generalGuidelines: [
      'Ensure all documents are clear and legible',
      'Follow the size and format specifications',
      'Keep original documents for verification'
    ],
    scrapingMetadata: {
      sources: ['form', 'guidelines'],
      confidence: 0.85,
      lastScrapeAttempt: new Date('2024-01-15'),
      scrapeSuccess: true,
      errorCount: 0
    },
    configuration: {
      examType: 'SSC',
      baseUrl: 'https://ssc.nic.in',
      formUrls: ['https://ssc.nic.in/apply'],
      faqUrls: ['https://ssc.nic.in/faq'],
      guidelineUrls: ['https://ssc.nic.in/guidelines'],
      updateFrequency: 'monthly',
      priority: 2
    },
    stats: {
      totalDocuments: 2,
      mandatoryDocuments: 2,
      avgConfidenceScore: 0.9,
      subjectiveRequirements: 2
    }
  }
};