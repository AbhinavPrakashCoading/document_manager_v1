import { FileWithMetadata } from '@/types/file';
import { DocumentRequirement } from '@/features/exam/types';

export interface ExamSchemaRequirement extends DocumentRequirement {
  type: string;
}

export interface ExamSchema {
  requirements: ExamSchemaRequirement[];
  version?: string;
}

export interface FileWithMeta {
  file: FileWithMetadata;
  requirement?: DocumentRequirement;
}
