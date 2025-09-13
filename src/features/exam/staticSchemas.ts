import { ExamSchema } from '@/features/exam/examSchema';

export const staticSchemas: Record<string, ExamSchema> = {
  'ielts': {
    examId: 'ielts',
    examName: 'IELTS',
    requirements: [
      {
        type: 'Photo',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        description: 'Passport size photo (filename: photo_rollno.jpg)',
      },
      {
        type: 'ID',
        format: 'PDF',
        maxSizeKB: 1024,
        description: 'Identity proof document (filename: id_rollno.pdf)',
      }
    ],
  },
  'ssc': {
    examId: 'ssc',
    examName: 'Staff Selection Commission',
    requirements: [
      {
        type: 'Photo',
        format: 'JPEG',
        maxSizeKB: 100,
        dimensions: '200x200',
        description: 'Passport size photo (filename: photo_rollno.jpg)',
      },
      {
        type: 'Signature',
        format: 'JPEG',
        maxSizeKB: 50,
        dimensions: '140x60',
        description: 'Signature image (filename: sign_rollno.jpg)',
      }
    ],
  }
};