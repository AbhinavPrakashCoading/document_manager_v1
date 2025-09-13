import { ExamSchema } from '@/features/exam/examSchema';
import { staticSchemas } from '@/features/exam/staticSchemas';

const dynamicRegistry: Record<string, ExamSchema> = {};

export async function getSchema(examId: string): Promise<ExamSchema> {
  if (staticSchemas[examId]) return staticSchemas[examId];
  if (dynamicRegistry[examId]) return dynamicRegistry[examId];

  // Enhanced scraper logic with new schema structure
  const scraped: ExamSchema = {
    examId,
    examName: `Mock ${examId.toUpperCase()}`,
    version: '2024.1.0',
    lastUpdated: new Date(),
    requirements: [
      {
        id: 'photo',
        type: 'Photo',
        displayName: 'Recent Photograph',
        description: 'Recent passport size photograph',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        namingConvention: 'photo_rollno.jpg',
        aliases: ['photograph', 'passport photo', 'photo'],
        category: 'photo',
        mandatory: true,
        subjective: [
          {
            field: 'photo',
            requirement: 'Recent passport size photograph with white background',
            context: 'Photo should be clear and recent',
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
        examples: ['Clear passport size photo with white background'],
        commonMistakes: ['Blurry photos', 'Dark background'],
        helpText: 'Upload a recent passport size photograph with white background'
      }
    ],
    generalGuidelines: [
      'Ensure all documents are clear and legible',
      'Follow the specified naming conventions'
    ],
    scrapingMetadata: {
      sources: ['form'],
      confidence: 0.8,
      lastScrapeAttempt: new Date(),
      scrapeSuccess: true,
      errorCount: 0
    },
    configuration: {
      examType: examId.toUpperCase(),
      baseUrl: `https://${examId}.example.com`,
      formUrls: [`https://${examId}.example.com/form`],
      faqUrls: [`https://${examId}.example.com/faq`],
      guidelineUrls: [`https://${examId}.example.com/guidelines`],
      updateFrequency: 'monthly',
      priority: 3
    },
    stats: {
      totalDocuments: 1,
      mandatoryDocuments: 1,
      avgConfidenceScore: 0.9,
      subjectiveRequirements: 1
    }
  };

  dynamicRegistry[examId] = scraped;
  return scraped;
}
