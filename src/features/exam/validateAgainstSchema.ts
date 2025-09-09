export function validateFileAgainstRequirement(
  file: File,
  requirement: {
    format: string;
    maxSizeKB: number;
    dimensions: string;
    namingConvention: string;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const maxBytes = requirement.maxSizeKB * 1024;

  if (file.size > maxBytes) {
    errors.push(`❌ ${file.name} exceeds max size of ${requirement.maxSizeKB}KB`);
  }

  if (!file.type.toLowerCase().includes(requirement.format.toLowerCase())) {
    errors.push(`❌ ${file.name} is of type ${file.type}, expected ${requirement.format}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}