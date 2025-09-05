import { describe, it, expect } from 'vitest';
import { scrapeUPSC } from '@/engines/upsc';

describe('scrapeUPSC', () => {
  it('should return a valid schema', async () => {
    const schema = await scrapeUPSC();
    expect(schema.examId).toBe('upsc');
    expect(schema.requirements.length).toBeGreaterThan(0);
  });
});