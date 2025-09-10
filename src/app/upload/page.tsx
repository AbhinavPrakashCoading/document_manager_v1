'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ExamSchema } from '@/features/exam/examSchema';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schema, setSchema] = useState<ExamSchema | null>(null);

  const validExams = ['ssc', 'upsc', 'ielts'];

  useEffect(() => {
    const param = searchParams.get('exam');
    const examId = param || localStorage.getItem('selectedExam');

    if (!examId || !validExams.includes(examId)) {
      router.replace('/select');
      return;
    }

    localStorage.setItem('selectedExam', examId);

    import(`@/schemas/${examId}.json`)
      .then((mod) => setSchema(mod.default))
      .catch(() => {
        console.error(`Schema load failed for ${examId}`);
        router.replace('/select');
      });
  }, [searchParams, router]);

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading schema...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-xl font-semibold text-center mb-6">
        📄 Upload Documents for {schema.examName}
      </h1>

      <section className="max-w-md mx-auto mb-6 text-sm bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">📋 Requirements Preview</h2>
        <ul className="list-disc ml-4 space-y-1 text-gray-700">
          {schema.requirements.map((req) => (
            <li key={req.type}>
              <strong>{req.type}</strong>: {req.format}, max {req.maxSizeKB}KB, {req.dimensions}
            </li>
          ))}
        </ul>
      </section>

      <UploadZone schema={schema} />
    </main>
  );
}