export type DocumentRequirement = {
  type: string; // e.g., "Photo", "Signature"
  format: 'JPG' | 'JPEG' | 'PNG' | 'PDF';
  maxSizeKB: number;
  dimensions?: string; // optional, e.g., "200x230"
};

export type ExamSchema = {
  examName: string;
  requirements: DocumentRequirement[];
};

export const UPSC: ExamSchema = {
  examName: 'UPSC Civil Services',
  requirements: [
    {
      type: 'Photo',
      format: 'JPG',
      maxSizeKB: 50,
      dimensions: '200x230',
    },
    {
      type: 'Signature',
      format: 'JPG',
      maxSizeKB: 20,
      dimensions: '140x60',
    },
  ],
};

export const SSC: ExamSchema = {
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

// Add more exams as needed