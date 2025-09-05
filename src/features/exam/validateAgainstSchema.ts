import { DocumentRequirement } from './examSchema';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateFileAgainstRequirement(
  file: File,
  requirement: DocumentRequirement
): ValidationResult {
  const errors: string[] = [];

  const fileFormat = file.type.split('/')[1].toUpperCase();
  const normalizeFormat = (format: string) =>
    format.toUpperCase().replace('JPEG', 'JPG');

  if (normalizeFormat(fileFormat) !== normalizeFormat(requirement.format)) {
    errors.push(`Invalid format: expected ${requirement.format}, got ${fileFormat}`);
  }

  const sizeKB = file.size / 1024;
  if (sizeKB > requirement.maxSizeKB) {
    errors.push(`File too large: ${Math.round(sizeKB)}KB > ${requirement.maxSizeKB}KB`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
