import { ExamSchema, Requirement } from '@/features/exam/examSchema';
import { ValidationResult } from './types';
import { config } from '@/config/validationConfig';
import { logDecision, persistAudit } from '@/features/audit/logger';

export function validateFile(file: File, schema: ExamSchema, rollNumber: string): ValidationResult[] {
  const errors: ValidationResult[] = [];

  const matchedReq = schema.requirements.find((r) =>
    file.name.toLowerCase().includes(r.type.toLowerCase())
  );

  if (!matchedReq) {
    errors.push({ type: 'unknown', message: 'No matching requirement found' });
    logDecision(file.name, 'fallback', 'No requirement matched');
    persistAudit({ file: file.name, rollNumber, result: 'No match', mode: 'fallback' });
    return errors;
  }

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