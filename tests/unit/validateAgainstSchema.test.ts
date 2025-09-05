import { describe, it, expect } from 'vitest';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';
import { UPSC } from '@/features/exam/examSchema';

const mockFile = (type: string, sizeKB: number): File =>
  new File(['x'.repeat(sizeKB * 1024)], 'test.jpg', { type });

describe('validateFileAgainstRequirement', () => {
  it('should pass for valid JPEG under size limit', () => {
    const file = mockFile('image/jpeg', 40);
    const result = validateFileAgainstRequirement(file, UPSC.requirements[0]);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should fail for wrong format', () => {
    const file = mockFile('image/png', 40);
    const result = validateFileAgainstRequirement(file, UPSC.requirements[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid format: expected JPEG, got PNG');
  });

  it('should fail for oversized file', () => {
    const file = mockFile('image/jpeg', 80);
    const result = validateFileAgainstRequirement(file, UPSC.requirements[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File too large: 80KB > 50KB');
  });
});
