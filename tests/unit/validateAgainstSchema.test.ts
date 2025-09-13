import { describe, it, expect } from 'vitest';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';

const mockFile = (type: string, sizeKB: number): File =>
  new File(['x'.repeat(sizeKB * 1024)], 'test.jpg', { type });

const requirement = {
  format: 'JPEG',
  maxSizeKB: 50,
  dimensions: '200x300',
  namingConvention: 'photo.jpg',
};

describe('validateFileAgainstRequirement', () => {
  it('passes for valid JPEG under size limit', () => {
    const file = mockFile('image/jpeg', 40);
    const result = validateFileAgainstRequirement(file, requirement);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('fails for wrong format', () => {
    const file = mockFile('image/png', 40);
    const result = validateFileAgainstRequirement(file, requirement);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `❌ test.jpg is of type image/png, expected ${requirement.format}`
    );
  });

  it('fails for oversized file', () => {
    const file = mockFile('image/jpeg', 80);
    const result = validateFileAgainstRequirement(file, requirement);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `❌ test.jpg exceeds max size of ${requirement.maxSizeKB}KB`
    );
  });

  it('fails for both format and size', () => {
    const file = mockFile('image/png', 80);
    const result = validateFileAgainstRequirement(file, requirement);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});