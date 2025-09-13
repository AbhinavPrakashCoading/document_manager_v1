'use client';

import { useState } from 'react';
import { FileWithMetadata } from '@/types/file';

interface UploadFieldProps {
  label: string;
  required: boolean;
  onUpload: (file: FileWithMetadata | null) => void;
  uploaded: boolean;
}

function UploadField({ label, required, onUpload, uploaded }: UploadFieldProps) {
  const [fileName, setFileName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || '');
    onUpload(file);
  };

  return (
    <div className={`border rounded p-4 mb-4 ${uploaded ? 'border-green-500' : 'border-red-500'}`}>
      <label className="block text-sm font-medium mb-2">{label}{required && ' *'}</label>
      <input type="file" onChange={handleChange} className="text-sm" />
      {fileName && <p className="text-xs text-gray-600 mt-1">📄 {fileName}</p>}
    </div>
  );
}

export { UploadField };
