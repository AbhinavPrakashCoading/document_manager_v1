import { ExamRegistry } from '@/features/exam/staticSchemas';
import { scrapeExam } from 'scraper-engine'; // dynamic import

const dynamicRegistry: Record<string, ExamSchema> = {};

export async function getSchema(examId: string): Promise<ExamSchema> {
  if (ExamRegistry[examId]) return ExamRegistry[examId];
  if (dynamicRegistry[examId]) return dynamicRegistry[examId];

  const scraped = await scrapeExam(examId); // pulls from engine
  dynamicRegistry[examId] = scraped;
  return scraped;
}