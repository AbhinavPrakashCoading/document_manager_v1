"use client";

import { useMemo, useState, ChangeEvent } from 'react';

interface UploadFieldProps {
  label: string;
  required: boolean;
  onUpload: (file: File | null) => void | Promise<void>;
  uploaded: boolean;
  accept?: string;
  helpText?: string;
}

function mapAcceptToMime(accept?: string): string | undefined {
  if (!accept) return undefined;
  const a = accept.toLowerCase();
  if (a === 'jpg' || a === 'jpeg') return 'image/jpeg';
  if (a === 'png') return 'image/png';
  if (a === 'pdf') return 'application/pdf';
  return accept; // fallback to whatever was provided
}

function UploadField({ label, required, onUpload, uploaded, accept, helpText }: UploadFieldProps) {
  const [fileName, setFileName] = useState('');
  const acceptAttr = useMemo(() => mapAcceptToMime(accept), [accept]);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? '');
    await onUpload(file);
  };

  return (
    <div className={`border rounded p-4 mb-4 ${uploaded ? 'border-green-500' : 'border-gray-300'}`}>
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input type="file" accept={acceptAttr} onChange={handleChange} className="text-sm" />
      {fileName && <p className="text-xs text-gray-600 mt-1">📄 {fileName}</p>}
      {helpText && <p className="text-xs text-blue-600 mt-1">💡 {helpText}</p>}
    </div>
  );
}

export { UploadField };
