"use client";

import { useMemo, useState, ChangeEvent } from 'react';
import { DOPToggle } from './DOPToggle';

interface DOPData {
  date: string;
  enabled: boolean;
}

interface UploadFieldProps {
  label: string;
  required: boolean;
  onUpload: (file: File | null, dopData?: DOPData & { addBand?: boolean }) => void | Promise<void>;
  uploaded: boolean;
  accept?: string;
  helpText?: string;
  fieldType?: string; // Added to determine if this is a photo field
  userName?: string; // Added for DOP band functionality
}

function mapAcceptToMime(accept?: string): string | undefined {
  if (!accept) return undefined;
  const a = accept.toLowerCase();
  if (a === 'jpg' || a === 'jpeg') return 'image/jpeg';
  if (a === 'png') return 'image/png';
  if (a === 'pdf') return 'application/pdf';
  return accept; // fallback to whatever was provided
}

function UploadField({ label, required, onUpload, uploaded, accept, helpText, fieldType = '', userName = '' }: UploadFieldProps) {
  const [fileName, setFileName] = useState('');
  const [dopData, setDOPData] = useState<DOPData & { addBand?: boolean }>({ date: '', enabled: false, addBand: false });
  const acceptAttr = useMemo(() => mapAcceptToMime(accept), [accept]);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? '');
    await onUpload(file, dopData.enabled ? dopData : undefined);
  };

  const handleDOPChange = (date: string | null, enabled: boolean, addBand?: boolean) => {
    const newDopData = { 
      date: date || '', 
      enabled,
      addBand: addBand || false
    };
    setDOPData(newDopData);
    
    // If there's already a file uploaded, re-trigger the upload with DOP data
    if (fileName && enabled && date) {
      // Note: In a real implementation, we'd need to store the file reference
      console.log('DOP updated for existing file:', fileName, 'Date:', date, 'Band:', addBand);
    }
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
      
      {/* DOP Toggle for photo fields */}
      <DOPToggle
        onDOPChange={handleDOPChange}
        initialDate={dopData.date}
        fieldType={fieldType}
        userName={userName}
      />
    </div>
  );
}

export { UploadField };
