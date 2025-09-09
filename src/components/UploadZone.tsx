'use client';

import { useState, useEffect } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { ExamSchema } from '@/features/exam/examSchema';
import { generateZip, FileWithMeta } from '@/features/package/zipService';
import { ZipPreviewModal } from './ZipPreviewModal';
import toast from 'react-hot-toast';

export function UploadZone({ schema }: { schema: ExamSchema }) {
  const { files, results, handleUpload } = useUpload(schema);
  const [rollNumber, setRollNumber] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<FileWithMeta[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('uploadHistory');
    if (cached) setHistory(JSON.parse(cached));
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadHistory', JSON.stringify(files.map((f) => f.name)));
    setHistory(files.map((f) => f.name));
  }, [files]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      Array.from(selected).forEach((file) => handleUpload(file));
    }
  };

  const handleDownloadZip = () => {
    const validFiles = files.filter((file) => results[file.name]?.length === 0);

    const fileWithMeta: FileWithMeta[] = validFiles.map((file) => {
      const matchedReq = schema.requirements.find((r) =>
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

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter Roll Number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        className="border px-2 py-1 rounded w-full text-sm"
      />

      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="block w-full text-sm"
      />

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.name} className="border p-2 rounded">
            <strong>{file.name}</strong>
            {results[file.name]?.length ? (
              <ul className="text-red-600 list-disc ml-4 text-sm">
                {results[file.name].map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600 text-sm">✅ Valid</p>
            )}
          </div>
        ))}
      </div>

      {files.length > 0 && (
        <button
          onClick={handleDownloadZip}
          disabled={!rollNumber}
          className={`w-full sm:w-auto px-4 py-2 rounded text-white ${
            rollNumber ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Preview ZIP
        </button>
      )}

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
    </div>
  );
}