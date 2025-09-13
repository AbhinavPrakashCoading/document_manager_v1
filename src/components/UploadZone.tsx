'use client';

import { useState, useEffect } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { ExamSchema } from '@/features/exam/examSchema';
import { generateZip, FileWithMeta } from '@/features/package/zipService';
import { ZipPreviewModal } from './ZipPreviewModal';
import toast from 'react-hot-toast';
import { transformFile } from '@/features/transform/transformFile';

import { EnhancedDocumentRequirement } from '@/features/exam/examSchema';

function convertSchemaToRequirements(schema: ExamSchema): EnhancedDocumentRequirement[] {
  return schema.requirements.map(req => ({
    ...req,
    id: req.id || `${req.type.toLowerCase()}_${Date.now()}`,
    displayName: req.displayName || req.type,
    description: req.description || `Upload ${req.type.toLowerCase()}`,
    aliases: req.aliases || [req.type.toLowerCase()],
    category: req.category || 'other',
    subjective: req.subjective || [],
    validationRules: req.validationRules || [
      {
        type: 'strict',
        rule: 'file_size_limit',
        message: `File size must not exceed ${req.maxSizeKB}KB`,
        field: req.type.toLowerCase(),
        canOverride: false
      }
    ],
    mandatory: req.mandatory ?? true,
    examples: req.examples || [],
    commonMistakes: req.commonMistakes || [],
    helpText: req.helpText || `Upload a valid ${req.type.toLowerCase()}`
  }));
}

export function UploadZone({ schema }: { schema: ExamSchema }) {
  const { files, results, handleUpload } = useUpload(schema);
  const [rollNumber, setRollNumber] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<FileWithMeta[]>([]);
  const requirements = convertSchemaToRequirements(schema);

  useEffect(() => {
    const cached = localStorage.getItem('uploadHistory');
    if (cached) setHistory(JSON.parse(cached));
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadHistory', JSON.stringify(files.map((f) => f.name)));
    setHistory(files.map((f) => f.name));
  }, [files]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    for (const file of Array.from(selected)) {
      const matchedReq = requirements.find((r) =>
        file.name.toLowerCase().includes(r.type.toLowerCase())
      );

      if (!matchedReq) {
        toast.error(`❌ Unknown file type: ${file.name}`);
        continue;
      }

      try {
        const transformed = await transformFile(file, matchedReq);
        handleUpload(transformed);
        toast.success(`✅ ${file.name} transformed and uploaded`);
      } catch (err) {
        console.error(err);
        toast.error(`⚠️ Failed to process ${file.name}`);
      }
    }
  };

  const handleDownloadZip = () => {
    const validFiles = files.filter((file) => results[file.name]?.length === 0);

    const fileWithMeta: FileWithMeta[] = validFiles.map((file) => {
      const matchedReq = requirements.find((r) =>
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
        rollNumber,
      };
    });

    setPreviewFiles(fileWithMeta);
    setShowPreview(true);
  };

  const iconMap: Record<string, string> = {
    photo: '📷',
    signature: '✍️',
    document: '📄',
  };

  const groupErrorsByType = (results: Record<string, string[]>) => {
    const grouped: Record<string, string[]> = {
      strict: [],
      soft: [],
      warning: [],
      unknown: [],
    };

    for (const [fileName, errors] of Object.entries(results)) {
      for (const err of errors) {
        const matchedReq = requirements.find((r) =>
          r.validationRules?.some(rule => rule.message === err)
        );

        if (matchedReq) {
          const rule = matchedReq.validationRules?.find(r => r.message === err);
          if (rule) {
            grouped[rule.type].push(fileName);
            continue;
          }
        }

        // Fallback categorization
        if (err.includes('exceeds max size') || err.includes('dimension')) {
          grouped.strict.push(fileName);
        } else if (err.includes('expected') && err.includes('type')) {
          grouped.soft.push(fileName);
        } else {
          grouped.unknown.push(fileName);
        }
      }
    }

    return grouped;
  };

  const errorGroups = groupErrorsByType(results);
  const totalErrors = Object.values(errorGroups).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
      <input
        type="text"
        placeholder="Enter Roll Number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        className="border px-2 py-2 rounded w-full text-sm"
      />

      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="block w-full text-sm"
      />

      {totalErrors > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4 text-sm space-y-2">
          <h3 className="font-semibold text-red-700">Validation Summary</h3>
          <ul className="list-disc ml-4">
            {Object.entries(errorGroups).map(([type, files]) => files.length > 0 && (
              <li key={type} className={`
                ${type === 'strict' ? 'text-red-600' : ''}
                ${type === 'soft' ? 'text-yellow-600' : ''}
                ${type === 'warning' ? 'text-blue-600' : ''}
                ${type === 'unknown' ? 'text-gray-600' : ''}
              `}>
                {type === 'strict' && '🚫 Critical Issues'}
                {type === 'soft' && '⚠️ Warnings'}
                {type === 'warning' && 'ℹ️ Suggestions'}
                {type === 'unknown' && '❓ Unknown Issues'}
                {' '}— {files.length} file(s)
                <ul className="ml-4 mt-1 text-xs">
                  {files.map(fileName => {
                    const matchedReq = requirements.find((r) =>
                      r.aliases?.some(alias => fileName.toLowerCase().includes(alias.toLowerCase()))
                    );
                    return (
                      <li key={fileName} className="flex items-start gap-2">
                        <span>•</span>
                        <div>
                          <span>{fileName}</span>
                          {matchedReq?.helpText && (
                            <p className="text-blue-500 mt-1">💡 {matchedReq.helpText}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            🔍 Review the requirements panel above for detailed guidelines and common mistakes to avoid.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {files.map((file) => {
          const matchedReq = requirements.find((r) =>
            file.name.toLowerCase().includes(r.type.toLowerCase())
          );

          const errors = results[file.name] || [];
          const isValid = errors.length === 0;
          const icon = iconMap[matchedReq?.type.toLowerCase() || 'document'];

          return (
            <details
              key={file.name}
              className={`border rounded ${
                isValid ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <summary className="flex justify-between items-center px-3 py-2 text-sm cursor-pointer">
                <span>{icon} {file.name}</span>
                <span className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isValid ? '✅ Valid' : '❌ Errors'}
                </span>
              </summary>

              <div className="px-4 py-2 space-y-1 text-xs text-gray-700">
                {matchedReq && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <p><span className="font-medium">Type:</span> {matchedReq.displayName}</p>
                      <p><span className="font-medium">Category:</span> {matchedReq.category}</p>
                      <p><span className="font-medium">Format:</span> {matchedReq.format}</p>
                      <p><span className="font-medium">Max Size:</span> {matchedReq.maxSizeKB}KB</p>
                      {matchedReq.dimensions && (
                        <p><span className="font-medium">Dimensions:</span> {matchedReq.dimensions}</p>
                      )}
                    </div>

                    {matchedReq.subjective && matchedReq.subjective.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Requirements:</p>
                        <ul className="ml-4">
                          {matchedReq.subjective
                            .filter(sub => sub.confidence >= 0.8)
                            .map((sub, idx) => (
                              <li key={idx} className="text-gray-600 flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{sub.requirement}</span>
                              </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-red-600">Issues:</strong>
                    <ul className="ml-4 space-y-1">
                      {errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {history.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-700">📁 Upload History</summary>
          <ul className="list-disc ml-4 text-xs text-gray-600">
            {history.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </details>
      )}

      {showPreview && (
        <ZipPreviewModal
          files={previewFiles}
          onConfirm={async () => {
            await generateZip(previewFiles, schema);
            toast.success('ZIP downloaded successfully!');
            setShowPreview(false);
          }}
          onCancel={() => setShowPreview(false)}
        />
      )}

      {files.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
          <button
            onClick={handleDownloadZip}
            disabled={!rollNumber}
            className={`w-full px-4 py-2 rounded text-white ${
              rollNumber ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Preview ZIP
          </button>
        </div>
      )}
    </div>
  );
}
