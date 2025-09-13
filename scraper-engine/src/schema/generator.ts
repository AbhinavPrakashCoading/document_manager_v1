import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExamSchema } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function writeSchema(schema: ExamSchema, examId: string) {
  const outputPath = path.resolve(__dirname, `../../output/${examId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Schema written to ${outputPath}`);
}