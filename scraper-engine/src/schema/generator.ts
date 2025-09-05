import fs from 'fs';
import path from 'path';
import { ExamSchema } from './types';

export function writeSchema(schema: ExamSchema, examId: string) {
  const outputPath = path.resolve(__dirname, `../../output/${examId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Schema written to ${outputPath}`);
}