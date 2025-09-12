export interface DocumentRequirement {
  type: string;
  format: string;
  maxSizeKB: number;
  dimensions?: string;
  description?: string;
}

export type Requirement = DocumentRequirement;
