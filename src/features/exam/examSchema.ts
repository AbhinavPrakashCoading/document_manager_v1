export type DocumentRequirement = {
  type: string; // e.g., "Photo", "Signature", "Passport Scan"
  format: 'JPG' | 'JPEG' | 'PNG' | 'PDF';
  maxSizeKB: number;
  dimensions?: string; // e.g., "200x230"
  dpi?: number; // optional, e.g., 300
  namingConvention?: string; // e.g., "photo_rollno.jpg"
};

export type ExamSchema = {
  examId: string;
  examName: string;
  requirements: DocumentRequirement[];
};

// UPSC Civil Services
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

// SSC CGL
export const SSC: ExamSchema = {
  examId: 'ssc',
  examName: 'SSC CGL',
  requirements: [
    {
      type: 'Photo',
      format: 'JPEG',
      maxSizeKB: 100,
    },
    {
      type: 'Signature',
      format: 'JPEG',
      maxSizeKB: 50,
    },
  ],
};

// IELTS Academic
export const IELTS: ExamSchema = {
  examId: 'ielts',
  examName: 'IELTS Academic',
  requirements: [
    {
      type: 'Passport Scan',
      format: 'PDF',
      maxSizeKB: 500,
      namingConvention: 'passport_scan.pdf',
    },
  ],
};

// Registry for easy lookup
export const ExamRegistry: Record<string, ExamSchema> = {
  upsc: UPSC,
  ssc: SSC,
  ielts: IELTS,
};
