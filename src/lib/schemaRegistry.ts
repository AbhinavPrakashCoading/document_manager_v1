import { ExamRegistry } from '@/features/exam/examSchema';
import { ExamSchema } from '@/features/exam/examSchema';
// import { scrapeExam } from 'scraper-engine'; // stub for now

const dynamicRegistry: Record<string, ExamSchema> = {};

export async function getSchema(examId: string): Promise<ExamSchema> {
  if (ExamRegistry[examId]) return ExamRegistry[examId];
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
        namingConvention: 'photo_rollno.jpg',
      },
    ],
  };

  dynamicRegistry[examId] = scraped;
  return scraped;
}
