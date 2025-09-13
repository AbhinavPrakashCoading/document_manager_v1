import { ExamSchema } from '@/features/exam/examSchema';
import { staticSchemas } from '@/features/exam/staticSchemas';

const dynamicRegistry: Record<string, ExamSchema> = {};

export async function getSchema(examId: string): Promise<ExamSchema> {
  if (staticSchemas[examId]) return staticSchemas[examId];
  if (dynamicRegistry[examId]) return dynamicRegistry[examId];

  // Stubbed scraper logic
  const scraped: ExamSchema = {
    examId,
    examName: `Mock ${examId.toUpperCase()}`,
    requirements: [
      {
        type: 'Photo',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        description: 'Passport size photo (filename: photo_rollno.jpg)',
      },
    ],
  };

  dynamicRegistry[examId] = scraped;
  return scraped;
}
