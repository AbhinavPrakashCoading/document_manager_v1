import { useState } from 'react';
import { ExamSchema } from '@/features/exam/examSchema';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';

export function useUpload(schema: ExamSchema) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Record<string, string[]>>({});

  const handleUpload = (file: File) => {
    const errors: string[] = [];

    schema.requirements.forEach((req) => {
      const result = validateFileAgainstRequirement(file, req);
      if (!result.valid) errors.push(...result.errors);
    });

    setFiles((prev) => [...prev, file]);
    setResults((prev) => ({ ...prev, [file.name]: errors }));
  };

  return { files, results, handleUpload };
}
