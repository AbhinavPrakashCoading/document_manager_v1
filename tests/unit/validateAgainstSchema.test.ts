import { describe, it, expect } from 'vitest';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';
import { UPSC } from '@/features/exam/examSchema';

describe('validateFileAgainstRequirement', () => {
  it('should pass validation for correct file', () => {
    const validFile = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 48000, // ~47KB
      dimensions: '200x230',
    };

    const result = validateFileAgainstRequirement(validFile, UPSC.requirements[0]);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should fail if format is incorrect', () => {
    const invalidFormatFile = {
      name: 'photo.png',
      type: 'image/png',
      size: 48000,
      dimensions: '200x230',
    };

    const result = validateFileAgainstRequirement(invalidFormatFile, UPSC.requirements[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid format: expected JPG, got PNG');
  });

  it('should fail if size exceeds limit', () => {
    const largeFile = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 60000, // ~58KB
      dimensions: '200x230',
    };

    const result = validateFileAgainstRequirement(largeFile, UPSC.requirements[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File too large: max 50KB, got 59KB');
  });

  it('should fail if dimensions are incorrect', () => {
    const wrongDimensionsFile = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 48000,
      dimensions: '300x300',
    };

    const result = validateFileAgainstRequirement(wrongDimensionsFile, UPSC.requirements[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Incorrect dimensions: expected 200x230, got 300x300');
  });
});