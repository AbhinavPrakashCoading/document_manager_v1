'use client';

import { EnhancedDocumentRequirement, ValidationRule } from '@/features/exam/examSchema';

interface FileWithMeta {
  file: File;
  requirement: EnhancedDocumentRequirement;
}

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
            <li key={file.name} className="border p-3 rounded space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <strong className="text-blue-600">{file.name}</strong>
                  <p className="text-xs text-gray-500">{requirement.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  requirement.mandatory ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {requirement.mandatory ? 'Required' : 'Optional'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <p><span className="font-medium">Type:</span> {requirement.type}</p>
                <p><span className="font-medium">Category:</span> {requirement.category}</p>
                <p><span className="font-medium">Format:</span> {requirement.format}</p>
                <p><span className="font-medium">Size:</span> {requirement.maxSizeKB}KB</p>
                {requirement.dimensions && (
                  <p><span className="font-medium">Dimensions:</span> {requirement.dimensions}</p>
                )}
              </div>

              {requirement.validationRules && requirement.validationRules.some(rule => rule.type === 'strict') && (
                <div className="mt-1">
                  <p className="text-xs font-medium text-red-600">Critical Requirements:</p>
                  <ul className="ml-4 text-xs">
                    {requirement.validationRules
                      .filter(rule => rule.type === 'strict')
                      .map((rule, idx) => (
                        <li key={idx} className="text-red-600">• {rule.message}</li>
                      ))}
                  </ul>
                </div>
              )}

              {requirement.helpText && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 {requirement.helpText}
                </p>
              )}
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