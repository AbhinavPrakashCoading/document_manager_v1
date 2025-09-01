import { describe, it, expect } from 'vitest';
import { ExamRegistry } from '@/features/exam/examSchema';

describe('ExamRegistry', () => {
  it('should contain valid exam schemas', () => {
    Object.values(ExamRegistry).forEach((schema) => {
      expect(schema.examId).toBeDefined();
      expect(schema.examName).toBeDefined();
      expect(Array.isArray(schema.requirements)).toBe(true);
      expect(schema.requirements.length).toBeGreaterThan(0);
    });
  });

  it('should have valid document requirements', () => {
    Object.values(ExamRegistry).forEach((schema) => {
      schema.requirements.forEach((req) => {
        expect(typeof req.type).toBe('string');
        expect(['JPG', 'JPEG', 'PNG', 'PDF']).toContain(req.format);
        expect(req.maxSizeKB).toBeGreaterThan(0);

        if (req.dimensions) {
          expect(req.dimensions).toMatch(/^\d+x\d+$/); // e.g., "200x230"
        }

        if (req.namingConvention) {
          expect(typeof req.namingConvention).toBe('string');
        }
      });
    });
  });
});
