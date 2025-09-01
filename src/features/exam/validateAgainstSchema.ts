import { DocumentRequirement } from './examSchema';

export type UploadedFileMeta = {
  name: string;
  type: string; // MIME type, e.g., "image/jpeg"
  size: number; // in bytes
  dimensions?: string; // optional, e.g., "200x230"
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateFileAgainstRequirement(
  file: UploadedFileMeta,
  requirement: DocumentRequirement
): ValidationResult {
  const errors: string[] = [];

  // Format check with normalization
const fileFormat = file.type.split('/')[1].toUpperCase();

const normalizeFormat = (format: string) =>
  format.toUpperCase().replace('JPEG', 'JPG');

if (normalizeFormat(fileFormat) !== normalizeFormat(requirement.format)) {
  errors.push(`Invalid format: expected ${requirement.format}, got ${fileFormat}`);
}

  // Size check
  const sizeKB = Math.round(file.size / 1024);
  if (sizeKB > requirement.maxSizeKB) {
    errors.push(`File too large: max ${requirement.maxSizeKB}KB, got ${sizeKB}KB`);
  }

  // Dimensions check (optional)
  if (requirement.dimensions && file.dimensions !== requirement.dimensions) {
    errors.push(`Incorrect dimensions: expected ${requirement.dimensions}, got ${file.dimensions}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}