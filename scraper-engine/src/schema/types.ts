export interface RequirementVersion {
  version: string;
  lastUpdated: string;
  source: string;
  requirements: {
    photo: PhotoRequirement;
    signature: SignatureRequirement;
    documents: DocumentRequirement;
  };
}

export interface PhotoRequirement {
  type: string;
  format: string[];
  maxSizeKB: number;
  dimensions: {
    width: { min: number; max: number };
    height: { min: number; max: number };
  };
  backgroundColor: string;
  namingConvention: string;
  additional: string[];
}

export interface SignatureRequirement {
  type: string;
  format: string[];
  maxSizeKB: number;
  dimensions: {
    width: { min: number; max: number };
    height: { min: number; max: number };
  };
  backgroundColor: string;
  namingConvention: string;
  additional: string[];
}

export interface DocumentRequirement {
  type: string;
  format: string[];
  maxSizeKB: number;
  namingConvention: string;
  required: string[];
}

export interface SchemaRegistry {
  institution: string;
  defaultVersion: string;
  versions: RequirementVersion[];
  fallback: RequirementVersion;
}

// Legacy types for backward compatibility
export type LegacyDocumentRequirement = {
  type: string;
  format: 'JPG' | 'JPEG' | 'PNG' | 'PDF';
  maxSizeKB: number;
  dimensions?: string;
  namingConvention?: string;
};

export type LegacyExamSchema = {
  examId: string;
  examName: string;
  requirements: LegacyDocumentRequirement[];
};