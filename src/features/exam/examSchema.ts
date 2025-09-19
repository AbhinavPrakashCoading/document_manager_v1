import { DocumentRequirement } from './types';

// Enhanced interfaces for subjective requirements
export interface SubjectiveRequirement {
  field: string;
  requirement: string;
  context: string;
  confidence: number;
  source: 'form' | 'faq' | 'guidelines' | 'examples';
  conditions?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ValidationRule {
  type: 'strict' | 'soft' | 'warning';
  rule: string;
  message: string;
  field: string;
  canOverride: boolean;
}

export interface EnhancedDocumentRequirement extends DocumentRequirement {
  id: string;
  displayName: string;
  description: string;
  aliases: string[];
  category: 'identity' | 'educational' | 'photo' | 'signature' | 'certificate' | 'other';
  subjective: SubjectiveRequirement[];
  validationRules: ValidationRule[];
  mandatory: boolean;
  conditionalFor?: string[];
  examples?: string[];
  commonMistakes?: string[];
  helpText?: string;
}

export interface ScrapingMetadata {
  sources: string[];
  confidence: number;
  lastScrapeAttempt: Date;
  scrapeSuccess: boolean;
  errorCount: number;
  lastError?: string;
  nextScrapeScheduled?: Date;
}

export interface ExamConfiguration {
  examType: string;
  baseUrl: string;
  formUrls: string[];
  faqUrls: string[];
  guidelineUrls: string[];
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
}

export interface ExamSchema {
  examId: string;
  examName: string;
  version: string;
  lastUpdated: Date;
  requirements: EnhancedDocumentRequirement[];
  generalGuidelines: string[];
  scrapingMetadata: ScrapingMetadata;
  configuration: ExamConfiguration;
  properties?: {
    personalInfo?: {
      type: 'object';
      required: string[];
      properties: {
        name: {
          type: 'string';
          description: string;
        };
        dateOfBirth: {
          type: 'string';
          format: 'date';
          description: string;
        };
        registrationNumber: {
          type: 'string';
          description: string;
        };
      };
    };
    documents?: {
      type: 'array';
      items: {
        type: 'object';
        required: string[];
        properties: {
          type: {
            type: 'string';
            enum: string[];
            description: string;
          };
          file: {
            type: 'string';
            format: 'binary';
            description: string;
          };
        };
      };
    };
  };
  stats?: {
    totalDocuments: number;
    mandatoryDocuments: number;
    avgConfidenceScore: number;
    subjectiveRequirements: number;
  };
}

// Enhanced UPSC schema with subjective requirements
export const UPSC: ExamSchema = {
  examId: 'upsc',
  examName: 'UPSC Civil Services',
  version: '2024.1.0',
  lastUpdated: new Date('2024-01-15'),
  requirements: [
    {
      id: 'photo',
      type: 'Photo',
      displayName: 'Recent Photograph',
      description: 'Recent passport-size colored photograph',
      format: 'JPEG',
      maxSizeKB: 50,
      dimensions: '200x230',
      namingConvention: 'photo_rollno.jpg',
      aliases: ['photograph', 'passport photo', 'passport size photo', 'recent photo'],
      category: 'photo',
      mandatory: true,
      subjective: [
        {
          field: 'photo',
          requirement: 'Recent passport-size colored photograph with white/light colored background',
          context: 'Photo should be taken within the last 6 months and should be clearly visible',
          confidence: 0.9,
          source: 'form',
          priority: 'high'
        },
        {
          field: 'photo',
          requirement: 'Candidate should be in formal attire',
          context: 'Professional appearance expected in government exam photos',
          confidence: 0.7,
          source: 'guidelines',
          priority: 'medium'
        },
        {
          field: 'photo',
          requirement: 'Face should occupy 70-80% of the photograph',
          context: 'Clear facial recognition required for verification purposes',
          confidence: 0.8,
          source: 'faq',
          priority: 'high'
        }
      ],
      validationRules: [
        {
          type: 'strict',
          rule: 'file_size_limit',
          message: 'Photo file size must not exceed 50KB',
          field: 'photo',
          canOverride: false
        },
        {
          type: 'strict',
          rule: 'dimension_check',
          message: 'Photo dimensions must be exactly 200x230 pixels',
          field: 'photo',
          canOverride: false
        },
        {
          type: 'soft',
          rule: 'background_color',
          message: 'White or light colored background recommended',
          field: 'photo',
          canOverride: true
        },
        {
          type: 'warning',
          rule: 'photo_quality',
          message: 'Ensure photo is clear and face is clearly visible',
          field: 'photo',
          canOverride: true
        }
      ],
      examples: [
        'Clear passport-size photo with white background',
        'Professional headshot in formal attire',
        'Recent photo (within 6 months)'
      ],
      commonMistakes: [
        'Using old photographs',
        'Poor image quality or blurry photos',
        'Dark or inappropriate backgrounds',
        'Incorrect file size or dimensions'
      ],
      helpText: 'Upload a recent, clear photograph with white background. Ensure you are wearing formal attire and face is clearly visible.'
    },
    {
      id: 'signature',
      type: 'Signature',
      displayName: 'Signature Specimen',
      description: 'Clear signature specimen for verification',
      format: 'JPEG',
      maxSizeKB: 20,
      dimensions: '140x60',
      namingConvention: 'sign_rollno.jpg',
      aliases: ['signature', 'sign', 'signature specimen'],
      category: 'signature',
      mandatory: true,
      subjective: [
        {
          field: 'signature',
          requirement: 'Clear and legible signature on white paper',
          context: 'Signature will be used for verification throughout the examination process',
          confidence: 0.9,
          source: 'form',
          priority: 'high'
        },
        {
          field: 'signature',
          requirement: 'Signature should be done with black or blue ink',
          context: 'Dark ink ensures better scanning quality',
          confidence: 0.8,
          source: 'guidelines',
          priority: 'medium'
        },
        {
          field: 'signature',
          requirement: 'Sign in your usual style as in official documents',
          context: 'Signature will be matched with other official documents',
          confidence: 0.9,
          source: 'faq',
          priority: 'high'
        }
      ],
      validationRules: [
        {
          type: 'strict',
          rule: 'file_size_limit',
          message: 'Signature file size must not exceed 20KB',
          field: 'signature',
          canOverride: false
        },
        {
          type: 'strict',
          rule: 'dimension_check',
          message: 'Signature dimensions must be exactly 140x60 pixels',
          field: 'signature',
          canOverride: false
        },
        {
          type: 'soft',
          rule: 'signature_clarity',
          message: 'Ensure signature is clear and matches your usual style',
          field: 'signature',
          canOverride: true
        }
      ],
      examples: [
        'Clear signature on white paper with black ink',
        'Your usual signature style',
        'Legible signature without any smudges'
      ],
      commonMistakes: [
        'Blurry or unclear signatures',
        'Using pencil instead of ink',
        'Different signature style than usual',
        'Incorrect file dimensions'
      ],
      helpText: 'Scan your signature clearly on white paper. Use the same signature style you use in official documents.'
    }
  ],
  generalGuidelines: [
    'All documents should be scanned in high resolution for clarity',
    'File names should follow the specified naming convention',
    'Use only JPEG format for photos and signatures',
    'Ensure all documents are recent and valid',
    'Keep backup copies of all uploaded documents'
  ],
  scrapingMetadata: {
    sources: ['form', 'faq', 'guidelines'],
    confidence: 0.85,
    lastScrapeAttempt: new Date('2024-01-15'),
    scrapeSuccess: true,
    errorCount: 0,
    nextScrapeScheduled: new Date('2024-02-15')
  },
  configuration: {
    examType: 'UPSC',
    baseUrl: 'https://upsc.gov.in',
    formUrls: [
      'https://upsc.gov.in/examination/notification',
      'https://upsc.gov.in/sites/default/files/Detailed-Advertisement-No-05-2024-Engl.pdf'
    ],
    faqUrls: [
      'https://upsc.gov.in/FAQ-CSE',
      'https://upsc.gov.in/help/faq'
    ],
    guidelineUrls: [
      'https://upsc.gov.in/examination/rules-regulation',
      'https://upsc.gov.in/examination/guidelines'
    ],
    updateFrequency: 'monthly',
    priority: 1
  },
  stats: {
    totalDocuments: 2,
    mandatoryDocuments: 2,
    avgConfidenceScore: 0.85,
    subjectiveRequirements: 6
  }
};

// Enhanced SSC schema
export const SSC: ExamSchema = {
  examId: 'ssc',
  examName: 'SSC Combined Graduate Level',
  version: '2024.1.0',
  lastUpdated: new Date('2024-01-15'),
  requirements: [
    {
      id: 'photo',
      type: 'Photo',
      displayName: 'Recent Photograph',
      description: 'Recent passport-size photograph',
      format: 'JPEG',
      maxSizeKB: 100,
      dimensions: '100x120',
      namingConvention: 'photo_regid.jpg',
      aliases: ['photograph', 'passport photo', 'picture'],
      category: 'photo',
      mandatory: true,
      subjective: [
        {
          field: 'photo',
          requirement: 'Recent photograph not older than 3 months',
          context: 'Fresh photo required for accurate identification',
          confidence: 0.9,
          source: 'form',
          priority: 'high'
        },
        {
          field: 'photo',
          requirement: 'Light background preferred',
          context: 'Better contrast for document processing',
          confidence: 0.7,
          source: 'guidelines',
          priority: 'medium'
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
          type: 'strict',
          rule: 'dimension_check',
          message: 'Photo dimensions must be exactly 100x120 pixels',
          field: 'photo',
          canOverride: false
        }
      ],
      examples: ['Recent passport-size photo with light background'],
      commonMistakes: ['Using old photographs', 'Incorrect dimensions'],
      helpText: 'Upload a recent photograph taken within the last 3 months.'
    },
    {
      id: 'signature',
      type: 'Signature',
      displayName: 'Digital Signature',
      description: 'Scanned signature for verification',
      format: 'JPEG',
      maxSizeKB: 50,
      dimensions: '300x80',
      namingConvention: 'sign_regid.jpg',
      aliases: ['signature', 'sign'],
      category: 'signature',
      mandatory: true,
      subjective: [
        {
          field: 'signature',
          requirement: 'Clear signature in black ink',
          context: 'Dark ink ensures better scan quality',
          confidence: 0.8,
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
      examples: ['Clear signature in black ink on white paper'],
      commonMistakes: ['Using pencil', 'Blurry scans'],
      helpText: 'Sign clearly with black ink and scan at high resolution.'
    }
  ],
  generalGuidelines: [
    'Follow SSC naming conventions strictly',
    'Ensure high scanning quality',
    'Keep documents ready before starting application'
  ],
  scrapingMetadata: {
    sources: ['form', 'guidelines'],
    confidence: 0.8,
    lastScrapeAttempt: new Date('2024-01-15'),
    scrapeSuccess: true,
    errorCount: 0
  },
  configuration: {
    examType: 'SSC',
    baseUrl: 'https://ssc.nic.in',
    formUrls: ['https://ssc.nic.in/Portal/apply'],
    faqUrls: ['https://ssc.nic.in/Portal/FAQ'],
    guidelineUrls: ['https://ssc.nic.in/Portal/SchemeExamination'],
    updateFrequency: 'monthly',
    priority: 2
  },
  stats: {
    totalDocuments: 2,
    mandatoryDocuments: 2,
    avgConfidenceScore: 0.8,
    subjectiveRequirements: 3
  }
};

// Enhanced IELTS schema
export const IELTS: ExamSchema = {
  examId: 'ielts',
  examName: 'IELTS Academic/General',
  version: '2024.1.0',
  lastUpdated: new Date('2024-01-15'),
  requirements: [
    {
      id: 'passport_photo',
      type: 'Photo',
      displayName: 'Passport Style Photo',
      description: 'Recent passport-style photograph',
      format: 'JPEG',
      maxSizeKB: 200,
      dimensions: '200x200',
      namingConvention: 'passport_photo.jpg',
      aliases: ['passport photo', 'id photo', 'identification photo'],
      category: 'photo',
      mandatory: true,
      subjective: [
        {
          field: 'passport_photo',
          requirement: 'Must be taken within the last 6 months',
          context: 'Recent photo required for test day identification',
          confidence: 0.9,
          source: 'form',
          priority: 'high'
        },
        {
          field: 'passport_photo',
          requirement: 'Plain white or off-white background',
          context: 'Standard passport photo requirements',
          confidence: 0.9,
          source: 'guidelines',
          priority: 'high'
        },
        {
          field: 'passport_photo',
          requirement: 'Professional appearance, no sunglasses or head coverings except for religious purposes',
          context: 'Clear identification required for test security',
          confidence: 0.8,
          source: 'faq',
          priority: 'medium'
        }
      ],
      validationRules: [
        {
          type: 'strict',
          rule: 'file_size_limit',
          message: 'Photo file size must not exceed 200KB',
          field: 'passport_photo',
          canOverride: false
        },
        {
          type: 'soft',
          rule: 'background_check',
          message: 'White or off-white background recommended',
          field: 'passport_photo',
          canOverride: true
        }
      ],
      examples: [
        'Professional passport-style photo with white background',
        'Recent photo showing clear facial features',
        'No sunglasses or casual headwear'
      ],
      commonMistakes: [
        'Using casual photos or selfies',
        'Incorrect background color',
        'Photo older than 6 months',
        'Wearing sunglasses or inappropriate headwear'
      ],
      helpText: 'Upload a professional passport-style photo taken within the last 6 months with a plain white background.'
    },
    {
      id: 'identification',
      type: 'ID Document',
      displayName: 'Government ID',
      description: 'Valid government-issued identification',
      format: 'PDF',
      maxSizeKB: 500,
      dimensions: 'N/A',
      namingConvention: 'id_document.pdf',
      aliases: ['passport', 'national id', 'driving license', 'government id'],
      category: 'identity',
      mandatory: true,
      conditionalFor: ['international students', 'non-residents'],
      subjective: [
        {
          field: 'identification',
          requirement: 'Must be valid for at least 6 months beyond test date',
          context: 'Document validity required for test registration',
          confidence: 0.9,
          source: 'form',
          priority: 'high'
        },
        {
          field: 'identification',
          requirement: 'Name on ID must exactly match registration name',
          context: 'Name matching required for test day verification',
          confidence: 0.95,
          source: 'guidelines',
          priority: 'high'
        }
      ],
      validationRules: [
        {
          type: 'strict',
          rule: 'document_validity',
          message: 'ID document must be valid and not expired',
          field: 'identification',
          canOverride: false
        },
        {
          type: 'strict',
          rule: 'name_matching',
          message: 'Name on ID must match registration details',
          field: 'identification',
          canOverride: false
        }
      ],
      examples: [
        'Valid passport with at least 6 months validity',
        'Government-issued national ID card',
        'Valid driving license with photo'
      ],
      commonMistakes: [
        'Using expired documents',
        'Name mismatch between ID and registration',
        'Poor scan quality making text unreadable'
      ],
      helpText: 'Upload a clear scan of your valid government ID. Ensure name matches exactly with your registration.'
    }
  ],
  generalGuidelines: [
    'All documents must be in English or officially translated',
    'Scanned documents should be clear and readable',
    'Ensure all information is current and valid',
    'Keep original documents for test day verification'
  ],
  scrapingMetadata: {
    sources: ['form', 'faq', 'guidelines'],
    confidence: 0.88,
    lastScrapeAttempt: new Date('2024-01-15'),
    scrapeSuccess: true,
    errorCount: 0
  },
  configuration: {
    examType: 'IELTS',
    baseUrl: 'https://ielts.org',
    formUrls: ['https://ielts.org/book-a-test/how-to-apply'],
    faqUrls: ['https://ielts.org/help/article/frequently-asked-questions'],
    guidelineUrls: ['https://ielts.org/book-a-test/identification-requirements'],
    updateFrequency: 'monthly',
    priority: 3
  },
  stats: {
    totalDocuments: 2,
    mandatoryDocuments: 2,
    avgConfidenceScore: 0.88,
    subjectiveRequirements: 5
  }
};

// Enhanced Exam Registry with utility functions
export const ExamRegistry: Record<string, ExamSchema> = {
  upsc: UPSC,
  ssc: SSC,
  ielts: IELTS,
};

// Utility functions for enhanced functionality
export class ExamSchemaUtils {
  static getExamById(examId: string): ExamSchema | undefined {
    return ExamRegistry[examId.toLowerCase()];
  }

  static getAllExams(): ExamSchema[] {
    return Object.values(ExamRegistry);
  }

  static getExamsByCategory(category: string): ExamSchema[] {
    return Object.values(ExamRegistry).filter(exam => 
      exam.requirements.some(req => req.category === category)
    );
  }

  static getMandatoryDocuments(examId: string): EnhancedDocumentRequirement[] {
    const exam = this.getExamById(examId);
    return exam ? exam.requirements.filter(req => req.mandatory) : [];
  }

  static getDocumentById(examId: string, documentId: string): EnhancedDocumentRequirement | undefined {
    const exam = this.getExamById(examId);
    return exam ? exam.requirements.find(req => req.id === documentId) : undefined;
  }

  static getHighConfidenceRequirements(examId: string, minConfidence = 0.8): SubjectiveRequirement[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];
    
    return exam.requirements.flatMap(req => 
      req.subjective.filter(sub => sub.confidence >= minConfidence)
    );
  }

  static getDocumentsByAlias(examId: string, alias: string): EnhancedDocumentRequirement[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];
    
    return exam.requirements.filter(req => 
      req.aliases.some(a => a.toLowerCase().includes(alias.toLowerCase())) ||
      req.displayName.toLowerCase().includes(alias.toLowerCase())
    );
  }

  static getValidationRulesByType(examId: string, ruleType: 'strict' | 'soft' | 'warning'): ValidationRule[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];
    
    return exam.requirements.flatMap(req => 
      req.validationRules.filter(rule => rule.type === ruleType)
    );
  }

  static isSchemaUpToDate(examId: string, maxAgeInDays = 30): boolean {
    const exam = this.getExamById(examId);
    if (!exam) return false;
    
    const ageInMs = Date.now() - exam.lastUpdated.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    
    return ageInDays <= maxAgeInDays;
  }

  static getSchemaStats(examId: string): { totalDocs: number; mandatoryDocs: number; avgConfidence: number; } {
    const exam = this.getExamById(examId);
    if (!exam) return { totalDocs: 0, mandatoryDocs: 0, avgConfidence: 0 };
    
    const totalDocs = exam.requirements.length;
    const mandatoryDocs = exam.requirements.filter(req => req.mandatory).length;
    
    const allConfidences = exam.requirements.flatMap(req => 
      req.subjective.map(sub => sub.confidence)
    );
    const avgConfidence = allConfidences.length > 0 ? 
      allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length : 0;
    
    return { totalDocs, mandatoryDocs, avgConfidence };
  }

  static searchRequirements(examId: string, searchTerm: string): {
    documents: EnhancedDocumentRequirement[];
    subjectiveRequirements: SubjectiveRequirement[];
  } {
    const exam = this.getExamById(examId);
    if (!exam) return { documents: [], subjectiveRequirements: [] };
    
    const term = searchTerm.toLowerCase();
    
    const documents = exam.requirements.filter(req =>
      req.displayName.toLowerCase().includes(term) ||
      req.description.toLowerCase().includes(term) ||
      req.aliases.some(alias => alias.toLowerCase().includes(term)) ||
      req.helpText?.toLowerCase().includes(term)
    );
    
    const subjectiveRequirements = exam.requirements.flatMap(req => 
      req.subjective.filter(sub => 
        sub.requirement.toLowerCase().includes(term) ||
        sub.context.toLowerCase().includes(term)
      )
    );
    
    return { documents, subjectiveRequirements };
  }
}

// Export default for backward compatibility
export default ExamRegistry;