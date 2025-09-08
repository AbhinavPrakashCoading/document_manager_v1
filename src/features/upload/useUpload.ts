import { useState } from 'react';
import { ExamSchema } from '@/features/exam/examSchema';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';

export function useUpload(schema: ExamSchema) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Record<string, string[]>>({});

  const handleUpload = (file: File) => {
    const normalizedName = file.name.toLowerCase().replace(/\s+/g, '');

    const matchedReq = schema.requirements.find((req) => {
      const normalizedType = req.type.toLowerCase().replace(/\s+/g, '');
      return normalizedName.includes(normalizedType);
    });

    const errors: string[] = [];

    if (matchedReq) {
      const result = validateFileAgainstRequirement(file, matchedReq);
      if (!result.valid) errors.push(...result.errors);
    } else {
      errors.push('No matching requirement found for this file.');
    }

    setFiles((prev) => [...prev, file]);
    setResults((prev) => ({ ...prev, [file.name]: errors }));
  };

  return { files, results, handleUpload };
}