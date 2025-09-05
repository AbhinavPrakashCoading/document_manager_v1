// src/lib/schemaRegistry.ts
import { ExamRegistry } from '@/features/exam/staticSchemas';
import { scrapeExam } from 'scraper-engine';

export async function getSchema(examId: string): Promise<ExamSchema> {
  if (ExamRegistry[examId]) return ExamRegistry[examId];

  const scraped = await scrapeExam(examId); // dynamic import from engine
  ExamRegistry[examId] = scraped;
  return scraped;
}