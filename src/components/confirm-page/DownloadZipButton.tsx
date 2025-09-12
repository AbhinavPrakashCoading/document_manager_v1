'use client';

import { generateZip } from '@/features/package/zipService';
import toast from 'react-hot-toast';
import { FileWithMeta } from '@/features/package/zipService';
import { Requirement } from '@/features/exam/examSchema';

export function DownloadZipButton({
  files,
  schema,
}: {
  files: File[];
  schema: Requirement[];
}) {
  const handleDownload = async () => {
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
          namingConvention: file.name,
        },
        rollNumber: localStorage.getItem('rollNumber') || 'unknown',
      };
    });

    await generateZip(fileWithMeta, { requirements: schema });
    toast.success('ZIP downloaded successfully!');
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
