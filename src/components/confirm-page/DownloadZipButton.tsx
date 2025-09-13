'use client';

import React from 'react';
import { generateZip } from '@/features/package/zipService';
import { toast } from 'react-hot-toast';
import { DocumentRequirement } from '@/features/exam/types';
import { FileWithMeta } from '@/features/package/types';
import { ExamSchema } from '@/features/exam/examSchema';

interface DownloadZipButtonProps {
  files: File[];
  schema: DocumentRequirement[];
}

export function DownloadZipButton({
  files,
  schema,
}: DownloadZipButtonProps) {
  const handleDownload = async () => {
    try {
      const fileWithMeta: FileWithMeta[] = files.map((file) => {
        const matchedReq = schema.find((r) =>
          file.name.toLowerCase().includes(r.type.toLowerCase())
        );

        return {
          file,
          requirement: matchedReq ?? {
            type: 'Unknown',
            format: 'Unknown',
            maxSizeKB: 0,
            dimensions: 'Unknown',
          },
          rollNumber: localStorage.getItem('rollNumber') || 'unknown',
        };
      });

      const result = await generateZip(fileWithMeta, { requirements: schema });
      
      if (!result.success || !result.blob) {
        throw new Error(result.error || 'Failed to generate ZIP');
      }

      // Create download link
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submission.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('ZIP downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download ZIP');
    }
  };

  return (
    <div className="text-center mt-6">
      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm"
      >
        📦 Download ZIP
      </button>
    </div>
  );
}
