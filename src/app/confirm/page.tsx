'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileComparisonTable } from '@/components/confirm-page/FileComparisonTable';
import { ProcessButton } from '@/components/confirm-page/ProcessButton';
import { ProcessedPreview } from '@/components/confirm-page/ProcessedPreview';
import { DownloadZipButton } from '@/components/confirm-page/DownloadZipButton';
import { transformFile } from '@/features/transform/transformFile';
import { Requirement } from '@/features/exam/examSchema';

export default function ConfirmPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [schema, setSchema] = useState<Requirement[]>([]);
  const [processed, setProcessed] = useState<File[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const examId = localStorage.getItem('selectedExam');
    if (!examId) {
      router.replace('/select');
      return;
    }

    import(`@/schemas/${examId}.json`)
      .then((mod) => setSchema(mod.default.requirements))
      .catch(() => router.replace('/select'));

    const uploaded = window.uploadedFiles || [];
    if (uploaded.length === 0) router.replace('/upload');
    else setFiles(uploaded);
  }, [router]);

  const handleProcess = async () => {
    const transformed: File[] = [];

    for (const file of files) {
      const matchedReq = schema.find((r) =>
        file.name.toLowerCase().includes(r.type.toLowerCase())
      );

      if (!matchedReq) continue;

      try {
        const fixed = await transformFile(file, matchedReq);
        transformed.push(fixed);
      } catch (err) {
        console.error(`Failed to process ${file.name}`, err);
      }
    }

    setProcessed(transformed);
    setReady(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 space-y-8">
      <h1 className="text-xl font-semibold text-center">📦 Confirm & Process Uploads</h1>

      <FileComparisonTable files={files} schema={schema} />
      <ProcessButton onProcess={handleProcess} />

      {ready && (
        <>
          <ProcessedPreview files={processed} />
          <DownloadZipButton files={processed} schema={schema} />
        </>
      )}
    </main>
  );
}
