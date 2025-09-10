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