import { useState } from 'react';
import { ExamSchema } from '@/features/exam/examSchema';
import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';
import { DocumentRequirement } from '@/features/exam/types';

function getSchemaRequirements(schema: ExamSchema): DocumentRequirement[] {
  // If schema has direct requirements array, use it
  if (schema.requirements && Array.isArray(schema.requirements)) {
    return schema.requirements;
  }

  // Fallback to extracting from properties
  if (schema.properties?.documents?.items?.properties?.type?.enum) {
    return schema.properties.documents.items.properties.type.enum.map(type => ({
      type,
      format: 'image/jpeg',
      maxSizeKB: 1024,
      dimensions: '200x200'
    }));
  }

  // Default requirements if nothing else is available
  return [{
    type: 'document',
    format: 'image/jpeg',
    maxSizeKB: 1024,
    dimensions: '200x200'
  }];
}

export function useUpload(schema: ExamSchema) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Record<string, string[]>>({});
  const [requirements] = useState(() => getSchemaRequirements(schema));

  const handleUpload = (file: File) => {
    try {
      const normalizedName = file.name.toLowerCase().replace(/\s+/g, '');
      const errors: string[] = [];

      // Find matching requirement
      const matchedReq = requirements.find((req) => {
        const normalizedType = req.type.toLowerCase().replace(/\s+/g, '');
        return normalizedName.includes(normalizedType);
      });

      if (matchedReq) {
        const result = validateFileAgainstRequirement(file, matchedReq);
        if (!result.valid && result.errors) {
          errors.push(...result.errors);
        }
      } else {
        errors.push(`No matching requirement found for ${file.name}`);
      }

      // Update state
      setFiles(prev => [...prev, file]);
      setResults(prev => ({ ...prev, [file.name]: errors }));

    } catch (error) {
      console.error('Upload error:', error);
      setResults(prev => ({
        ...prev,
        [file.name]: ['Failed to process file: ' + (error instanceof Error ? error.message : 'Unknown error')]
      }));
    }
  };

  return { files, results, handleUpload, requirements };
}