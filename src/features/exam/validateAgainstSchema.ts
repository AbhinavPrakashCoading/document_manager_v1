interface ValidationRequirement {
  format?: string;
  maxSizeKB?: number;
  dimensions?: string;
  type: string;
  validationRules?: {
    type: 'strict' | 'soft' | 'warning';
    rule: string;
    message: string;
    field: string;
    canOverride: boolean;
  }[];
  subjective?: {
    field: string;
    requirement: string;
    context: string;
    confidence: number;
    source: 'form' | 'faq' | 'guidelines' | 'examples';
    priority: 'high' | 'medium' | 'low';
  }[];
  category?: string;
  mandatory?: boolean;
  aliases?: string[];
  helpText?: string;
}

export function validateFileAgainstRequirement(
  file: File,
  requirement: ValidationRequirement
): { valid: boolean; errors: string[]; warnings: string[]; subjectiveChecks: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const subjectiveChecks: string[] = [];

  // Check strict validation rules first
  if (requirement.validationRules) {
    requirement.validationRules.forEach(rule => {
      switch (rule.type) {
        case 'strict':
          if (!validateRule(file, rule)) {
            errors.push(`❌ ${rule.message}`);
          }
          break;
        case 'soft':
          if (!validateRule(file, rule)) {
            warnings.push(`⚠️ ${rule.message}`);
          }
          break;
        case 'warning':
          if (!validateRule(file, rule)) {
            warnings.push(`ℹ️ ${rule.message}`);
          }
          break;
      }
    });
  }

  // Add subjective requirements as checks to be performed
  if (requirement.subjective) {
    requirement.subjective.forEach(subReq => {
      if (subReq.confidence >= 0.8) { // High confidence requirements
        subjectiveChecks.push(`${subReq.requirement} (${subReq.context})`);
      }
    });
  }

  // Legacy checks as strict rules
  if (requirement.maxSizeKB) {
    const maxBytes = requirement.maxSizeKB * 1024;
    if (file.size > maxBytes) {
      errors.push(`❌ ${file.name} exceeds max size of ${requirement.maxSizeKB}KB`);
    }
  }

  if (requirement.format && !file.type.toLowerCase().includes(requirement.format.toLowerCase())) {
    errors.push(`❌ ${file.name} is of type ${file.type}, expected ${requirement.format}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    subjectiveChecks,
  };
}

function validateRule(file: File, rule: NonNullable<ValidationRequirement['validationRules']>[number]): boolean {
  switch (rule.rule) {
    case 'file_size_limit':
      const sizeMatch = rule.message.match(/(\d+)KB/);
      if (sizeMatch) {
        const maxSize = parseInt(sizeMatch[1]) * 1024;
        return file.size <= maxSize;
      }
      return true;
    case 'dimension_check':
      // Implement dimension checking logic here
      return true;
    case 'background_color':
    case 'photo_quality':
    case 'signature_clarity':
    case 'document_validity':
      // These require additional processing/AI validation
      return true;
    default:
      return true;
  }
}