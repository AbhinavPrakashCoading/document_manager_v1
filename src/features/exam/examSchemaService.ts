/**
 * Exam Schema Service
 * Provides access to exam schemas and related utilities
 */

import { ExamSchema } from '@/features/exam/examSchema';
import { staticSchemas } from '@/features/exam/staticSchemas';

/**
 * Get exam schema by exam type
 */
export async function getExamSchema(examType: string): Promise<ExamSchema> {
  // Convert exam type to lowercase for consistent lookup
  const normalizedExamType = examType.toLowerCase();
  
  // Check if schema exists in static schemas
  if (staticSchemas[normalizedExamType]) {
    return staticSchemas[normalizedExamType];
  }
  
  // If not found, throw error
  throw new Error(`Exam schema not found for: ${examType}`);
}

/**
 * Get all available exam types
 */
export function getAvailableExamTypes(): string[] {
  return Object.keys(staticSchemas);
}

/**
 * Check if exam type is supported
 */
export function isExamTypeSupported(examType: string): boolean {
  return staticSchemas.hasOwnProperty(examType.toLowerCase());
}

/**
 * Get exam display name
 */
export function getExamDisplayName(examType: string): string {
  const normalizedExamType = examType.toLowerCase();
  
  if (staticSchemas[normalizedExamType]) {
    return staticSchemas[normalizedExamType].examName;
  }
  
  return examType.toUpperCase();
}