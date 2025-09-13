'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UploadZone } from '@/components/upload-page/UploadZone';
import { RequirementsPanel } from '@/components/upload-page/RequirementsPanel';
import { getSchema } from '@/lib/schemaRegistry';
import { staticSchemas } from '@/features/exam/staticSchemas';
import { ExamSchema } from '@/features/exam/examSchema';

const validExams = ['ssc', 'upsc', 'ielts'];

export default function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schema, setSchema] = useState<ExamSchema | null>(null);
  
  useEffect(() => {
    const examId = searchParams.get('exam') || localStorage.getItem('selectedExam');
    
    if (!examId || !validExams.includes(examId)) {
      router.replace('/select');
      return;
    }
    
    localStorage.setItem('selectedExam', examId);
    
    const loadSchema = async () => {
      try {
        // Load from enhanced static schemas instead of legacy JSON
        const schemaData = staticSchemas[examId];
        if (schemaData) {
          setSchema(schemaData);
        } else {
          console.error(`Enhanced schema not found for ${examId}`);
          // Fallback to legacy JSON schema
          const mod = await import(`@/schemas/${examId}.json`);
          setSchema(mod.default);
        }
      } catch (err) {
        console.error(`Schema load failed for ${examId}:`, err);
        router.replace('/select');
      }
    };
    
    loadSchema();
  }, [router, searchParams]);

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

      <RequirementsPanel schema={schema} />
      <UploadZone schema={schema} />
    </main>
  );
}