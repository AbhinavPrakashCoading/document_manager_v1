import { ExamSchema } from '@/features/exam/examSchema';
import { ValidationResult, ValidationRuleResult, ValidationMode } from './types';
import { logDecision, persistAudit } from '@/features/audit/logger';

// Default validation config
const config = {
  strictMode: true,
  defaultFormat: 'image/jpeg',
  defaultMaxSizeKB: 500,
  defaultDimensions: '300x300'
};

function validateRule(file: File, rule: { type: ValidationMode; rule: string; message: string }): ValidationRuleResult {
  switch (rule.rule) {
    case 'file_size_limit':
      const sizeMatch = rule.message.match(/(\d+)KB/);
      if (sizeMatch) {
        const maxSize = parseInt(sizeMatch[1]) * 1024;
        if (file.size > maxSize) {
          return { valid: false, message: rule.message };
        }
      }
      break;
    case 'format_check':
      if (!file.type.toLowerCase().includes(rule.message.toLowerCase())) {
        return { valid: false, message: rule.message };
      }
      break;
  }
  return { valid: true, message: '' };
}

export function validateFile(file: File, schema: ExamSchema, rollNumber: string): ValidationResult[] {
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  // Try matching by name and aliases
  const matchedReq = schema.requirements.find((r) =>
    file.name.toLowerCase().includes(r.type.toLowerCase()) ||
    r.aliases?.some(alias => file.name.toLowerCase().includes(alias.toLowerCase()))
  );

  if (!matchedReq) {
    errors.push({ type: 'unknown', message: 'No matching requirement found' });
    logDecision(file.name, 'fallback', 'No requirement matched');
    persistAudit({ file: file.name, rollNumber, result: 'No match', mode: 'fallback' });
    return errors;
  }

  // Apply validation rules in order: strict -> soft -> warning
  matchedReq.validationRules?.forEach(rule => {
    const validationResult = validateRule(file, rule);
    if (!validationResult.valid) {
      if (rule.type === 'strict') {
        errors.push({ type: rule.rule, message: validationResult.message });
      } else {
        warnings.push({ type: rule.rule, message: validationResult.message });
      }
      logDecision(file.name, rule.type === 'strict' ? 'strict' : 'fallback', `${rule.rule}: ${validationResult.message}`);
    }
  });

  // Legacy validation as fallback
  const { format, maxSizeKB, dimensions } = matchedReq;
  const strict = config.strictMode ?? true;
  const fallbackFormat = config.defaultFormat ?? 'image/jpeg';
  const fallbackSize = config.defaultMaxSizeKB ?? 500;
  const fallbackDimensions = config.defaultDimensions ?? '300x300';

  const fileType = file.type || '';
  const fileSizeKB = Math.round(file.size / 1024);

  if (strict && format && fileType !== format) {
    errors.push({ type: 'format', message: `Expected type ${format}, got ${fileType}` });
    logDecision(file.name, 'strict', 'Format mismatch');
  } else if (!format && fileType !== fallbackFormat) {
    errors.push({ type: 'format', message: `Expected fallback type ${fallbackFormat}, got ${fileType}` });
    logDecision(file.name, 'fallback', 'Format fallback used');
  }

  if (strict && maxSizeKB && fileSizeKB > maxSizeKB) {
    errors.push({ type: 'size', message: `File exceeds max size of ${maxSizeKB}KB` });
    logDecision(file.name, 'strict', 'Size violation');
  } else if (!maxSizeKB && fileSizeKB > fallbackSize) {
    errors.push({ type: 'size', message: `File exceeds fallback size of ${fallbackSize}KB` });
    logDecision(file.name, 'fallback', 'Size fallback used');
  }

  if (strict && dimensions) {
    logDecision(file.name, 'strict', 'Dimensions check stubbed');
  }

  persistAudit({
    file: file.name,
    rollNumber,
    result: errors.length === 0 ? 'Valid' : 'Invalid',
    mode: strict ? 'strict' : 'fallback',
    errors,
  });

  return errors;
}