'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileComparisonTable } from '@/components/confirm-page/FileComparisonTable';
import { ProcessButton } from '@/components/confirm-page/ProcessButton';
import { ProcessedPreview } from '@/components/confirm-page/ProcessedPreview';
import { DownloadZipButton } from '@/components/confirm-page/DownloadZipButton';
import { transformFile } from '@/features/transform/transformFile';
import { DocumentRequirement } from '@/features/exam/types';

// Declare global window interface
declare global {
  interface Window {
    uploadedFiles?: File[];
  }
}

export default function ConfirmPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [schema, setSchema] = useState<DocumentRequirement[]>([]);
  const [processed, setProcessed] = useState<File[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const examId = localStorage.getItem('selectedExam');
    if (!examId) {
      router.replace('/select');
      return;
    }

    // Load and set schema
    const loadSchema = async () => {
      try {
        const mod = await import(`@/schemas/${examId}.json`);
        setSchema(mod.default.requirements || []);
      } catch (err) {
        console.error('Failed to load schema:', err);
        router.replace('/select');
      }
    };
    loadSchema();

    // Set files
    const uploaded = window.uploadedFiles || [];
    if (uploaded.length === 0) {
      router.replace('/upload');
    } else {
      setFiles(uploaded);
    }
  }, [router]);

  const handleProcess = async () => {
    const transformed: File[] = [];

    for (const file of files) {
      const matchedReq = schema.find((r: DocumentRequirement) =>
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
