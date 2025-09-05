export type DocumentRequirement = {
  type: string;
  format: 'JPG' | 'JPEG' | 'PNG' | 'PDF';
  maxSizeKB: number;
  dimensions?: string;
  namingConvention?: string;
};

export type ExamSchema = {
  examId: string;
  examName: string;
  requirements: DocumentRequirement[];
};

export const UPSC: ExamSchema = {
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

export const ExamRegistry: Record<string, ExamSchema> = {
  upsc: UPSC,
};
