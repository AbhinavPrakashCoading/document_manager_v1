interface ValidationRequirement {
  format?: string;
  maxSizeKB?: number;
  dimensions?: string;
  type: string;
}

export function validateFileAgainstRequirement(
  file: File,
  requirement: ValidationRequirement
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check size if maxSizeKB is specified
  if (requirement.maxSizeKB) {
    const maxBytes = requirement.maxSizeKB * 1024;
    if (file.size > maxBytes) {
      errors.push(`❌ ${file.name} exceeds max size of ${requirement.maxSizeKB}KB`);
    }
  }

  // Check format if specified
  if (requirement.format && !file.type.toLowerCase().includes(requirement.format.toLowerCase())) {
    errors.push(`❌ ${file.name} is of type ${file.type}, expected ${requirement.format}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}