'use client';

import { FileWithMetadata } from '@/types/file';

export function ProcessedPreview({ files }: { files: FileWithMetadata[] }) {
  return (
    <section className="max-w-3xl mx-auto bg-white p-4 rounded shadow text-sm mt-8">
      <h2 className="font-semibold mb-4">✅ Processed Files Preview</h2>
      <ul className="space-y-2 text-xs text-gray-700">
        {files.map((file) => (
          <li key={file.name} className="border rounded px-3 py-2">
            <strong>{file.name}</strong> — {file.type}, {Math.round(file.size / 1024)}KB
          </li>
        ))}
      </ul>
    </section>
  );
}
