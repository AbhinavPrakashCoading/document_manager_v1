'use client';

import { FileWithMetadata } from '@/types/file';
import { Requirement } from '@/features/exam/types';

interface Props {
  files: FileWithMetadata[];
  schema: Requirement[];
}

export function FileComparisonTable({ files, schema }: Props) {
  return (
    <section className="max-w-3xl mx-auto bg-white p-4 rounded shadow text-sm">
      <h2 className="font-semibold mb-4">📊 Uploaded Files vs Schema</h2>
      <table className="w-full border text-left text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">File Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Size (KB)</th>
            <th className="p-2">Format</th>
            <th className="p-2">Matches Schema</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const matched = schema.find((r) =>
              file.name.toLowerCase().includes(r.type.toLowerCase())
            );

            const sizeKB = Math.round(file.size / 1024);
            const formatMatch = matched?.format === file.type;
            const sizeMatch = matched?.maxSizeKB ? sizeKB <= matched.maxSizeKB : true;

            const isValid = matched && formatMatch && sizeMatch;

            return (
              <tr key={file.name} className={isValid ? 'bg-green-50' : 'bg-red-50'}>
                <td className="p-2">{file.name}</td>
                <td className="p-2">{matched?.type || 'Unknown'}</td>
                <td className="p-2">{sizeKB}</td>
                <td className="p-2">{file.type}</td>
                <td className="p-2 font-semibold">
                  {isValid ? '✅ Valid' : '❌ Mismatch'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
