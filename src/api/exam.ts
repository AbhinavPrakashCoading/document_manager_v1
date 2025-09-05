// src/api/exam.ts
import { getSchema } from '@/lib/schemaRegistry';

export async function POST(req: Request) {
  const { examId } = await req.json();
  const schema = await getSchema(examId); // triggers scraper if needed
  return Response.json(schema);
}