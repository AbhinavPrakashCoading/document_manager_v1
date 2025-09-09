'use client';

import { FileWithMeta } from '@/features/package/zipService';

export function ZipPreviewModal({
  files,
  onConfirm,
  onCancel,
}: {
  files: FileWithMeta[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold">📦 ZIP Preview</h2>
        <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
          {files.map(({ file, requirement }) => (
            <li key={file.name} className="border p-2 rounded">
              <strong>{file.name}</strong>
              <p className="text-gray-600">Type: {requirement.type}</p>
              <p className="text-gray-600">Format: {requirement.format}</p>
              <p className="text-gray-600">Max Size: {requirement.maxSizeKB}KB</p>
              <p className="text-gray-600">Dimensions: {requirement.dimensions}</p>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
}