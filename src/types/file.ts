export interface FileWithMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  meta?: {
    type: string;
    requirements: {
      format: string;
      maxSizeKB: number;
      dimensions?: string;
    };
  };
}
