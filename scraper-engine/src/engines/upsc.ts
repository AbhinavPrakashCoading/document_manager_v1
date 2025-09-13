import { ExamSchema } from '../schema/types';

export async function scrapeUPSC(): Promise<ExamSchema> {
  // Stubbed logic — replace with real scraping later
  return {
    examId: 'upsc',
    examName: 'UPSC Civil Services',
    requirements: [
      {
        type: 'Photo',
        format: 'JPEG',
        maxSizeKB: 50,
        dimensions: '200x230',
        namingConvention: 'photo_rollno.jpg',
      },
      {
        type: 'Signature',
        format: 'JPEG',
        maxSizeKB: 20,
        dimensions: '140x60',
        namingConvention: 'sign_rollno.jpg',
      },
    ],
  };
}
