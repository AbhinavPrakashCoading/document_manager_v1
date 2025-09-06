import { useState } from 'react';
import { ExamSelector } from '@/components/ExamSelector';
import { UploadZone } from '@/components/UploadZone';


export default function Home() {
  const [schemas, setSchemas] = useState<any[]>([]);

  const handleSchemaFetched = (schema: any) => {
    setSchemas((prev) => [...prev, schema]);
  };

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Document Manager</h1>
      <ExamSelector onSchemaFetched={handleSchemaFetched} />

     {schemas.map((schema) => (
  <div key={schema.examId} className="border p-4 rounded space-y-4">
    <h2 className="font-semibold">{schema.examName}</h2>
    <ul className="list-disc ml-4">
      {schema.requirements.map((req: any, idx: number) => (
        <li key={idx}>
          {req.type} — {req.format}, max {req.maxSizeKB}KB, {req.dimensions}
        </li>
      ))}
    </ul>

    <UploadZone schema={schema} />
  </div>
))}
    </main>
  );
}
