import { describe, it, expect } from 'vitest';
import { ExamRegistry } from '@/features/exam/examSchema';

describe('ExamRegistry', () => {
  it('should contain valid exam schemas', () => {
    Object.values(ExamRegistry).forEach((schema) => {
      expect(schema.examId).toBeDefined();
      expect(schema.examName).toBeDefined();
      expect(Array.isArray(schema.requirements)).toBe(true);
      expect(schema.requirements.length).toBeGreaterThan(0);
      expect(schema.version).toBeDefined();
      expect(schema.lastUpdated).toBeInstanceOf(Date);
      expect(schema.scrapingMetadata).toBeDefined();
      expect(schema.configuration).toBeDefined();
    });
  });

  it('should have valid document requirements with enhanced features', () => {
    Object.values(ExamRegistry).forEach((schema) => {
      schema.requirements.forEach((req) => {
        // Basic requirement validation
        expect(typeof req.type).toBe('string');
        expect(['JPG', 'JPEG', 'PNG', 'PDF']).toContain(req.format);
        expect(req.maxSizeKB).toBeGreaterThan(0);

        // Enhanced fields validation
        expect(req.id).toBeDefined();
        expect(req.displayName).toBeDefined();
        expect(req.description).toBeDefined();
        expect(Array.isArray(req.aliases)).toBe(true);
        expect(['identity', 'educational', 'photo', 'signature', 'certificate', 'other']).toContain(req.category);
        
        // Validation rules
        if (req.validationRules) {
          req.validationRules.forEach(rule => {
            expect(['strict', 'soft', 'warning']).toContain(rule.type);
            expect(rule.rule).toBeDefined();
            expect(rule.message).toBeDefined();
            expect(rule.field).toBeDefined();
            expect(typeof rule.canOverride).toBe('boolean');
          });
        }

        // Subjective requirements
        if (req.subjective) {
          req.subjective.forEach(subReq => {
            expect(subReq.field).toBeDefined();
            expect(subReq.requirement).toBeDefined();
            expect(subReq.context).toBeDefined();
            expect(subReq.confidence).toBeGreaterThan(0);
            expect(subReq.confidence).toBeLessThanOrEqual(1);
            expect(['form', 'faq', 'guidelines', 'examples']).toContain(subReq.source);
            expect(['high', 'medium', 'low']).toContain(subReq.priority);
          });
        }
      });
    });
  });
});
