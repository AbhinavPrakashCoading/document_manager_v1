import { DocumentRequirement } from './types';

export interface ExamSchema {
  examId: string;
  examName: string;
  requirements: DocumentRequirement[];
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
}

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
