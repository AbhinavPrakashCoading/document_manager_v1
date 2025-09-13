'use client';

import { useState, useEffect } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { ExamSchema } from '@/features/exam/examSchema';
import { generateZip, FileWithMeta } from '@/features/package/zipService';
import { ZipPreviewModal } from '../ZipPreviewModal';
import { NamingPopup } from './NamingPopup';
import { UploadField } from './UploadField';
import { CertificateDetails } from './CertificateDetails';
import { CompletionButtons } from './CompletionButtons';
import toast from 'react-hot-toast';
import { transformFile } from '@/features/transform/transformFile';

import { DocumentRequirement } from '@/features/exam/types';

function getDefaultRequirements(schema: any): any[] {
  if (schema.requirements) {
    return schema.requirements;
  }
  
  // Fallback to older schema format
  return (schema.properties?.documents?.items?.properties?.type?.enum || []).map((type: string) => ({
    id: type.toLowerCase(),
    type,
    displayName: type.charAt(0).toUpperCase() + type.slice(1),
    description: `Upload ${type.toLowerCase()} document`,
    format: 'image/jpeg',  // Default format
    maxSizeKB: 1024,      // Default max size
    dimensions: '200x200', // Default dimensions
    mandatory: true,
    helpText: `Please upload a valid ${type.toLowerCase()} document`
  }));
}

export function UploadForm({ schema }: { schema: any }) {
  const { files, results, handleUpload } = useUpload(schema);
  const [showNaming, setShowNaming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<FileWithMeta[]>([]);
  const requirements = getDefaultRequirements(schema);
  const [uploadedTypes, setUploadedTypes] = useState<Record<string, boolean>>({});

  const onFileUpload = async (type: string, file: File | null) => {
    if (!file) {
      setUploadedTypes(prev => ({ ...prev, [type]: false }));
      return;
    }

    try {
      const matchedReq = requirements.find((r: DocumentRequirement) => r.type === type);
      if (!matchedReq) {
        toast.error(`❌ Invalid document type: ${type}`);
        setUploadedTypes(prev => ({ ...prev, [type]: false }));
        return;
      }

      // Transform the file first
      const transformed = await transformFile(file as File, matchedReq);
      
      // Handle the upload and check for validation errors
      handleUpload(transformed);
      
      // Get the validation results for this file
      const hasErrors = results[transformed.name]?.length > 0;
      
      if (hasErrors) {
        toast.error(`❌ ${type} validation failed`);
        setUploadedTypes(prev => ({ ...prev, [type]: false }));
      } else {
        setUploadedTypes(prev => ({ ...prev, [type]: true }));
        toast.success(`✅ ${type} uploaded successfully`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`⚠️ Failed to process ${type}`);
      setUploadedTypes(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleNamingSubmit = async (data: { roll: string; name: string; age: string }) => {
    const validFiles = files.filter(file => {
      const type = requirements.find(r => 
        file.name.toLowerCase().includes(r.type.toLowerCase())
      )?.type;
      return type && !results[file.name]?.length;
    });

    const fileWithMeta: FileWithMeta[] = validFiles.map(file => {
      const matchedReq = requirements.find(r =>
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
        rollNumber: data.roll,
      };
    });

    setPreviewFiles(fileWithMeta);
    setShowNaming(false);
    setShowPreview(true);
  };

  const allUploaded = requirements.every(
    (req: DocumentRequirement) => uploadedTypes[req.type]
  );

  return (
    <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
      {requirements.map((req) => (
        <div key={req.id || req.type} className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{req.displayName || req.type}</h3>
              <p className="text-sm text-gray-600">{req.description || `Upload ${req.type}`}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              req.mandatory !== false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {req.mandatory !== false ? 'Required' : 'Optional'}
            </span>
          </div>

          <UploadField
            label={req.displayName || req.type}
            required={req.mandatory !== false}
            onUpload={(file) => onFileUpload(req.type, file as File)}
            uploaded={uploadedTypes[req.type] || false}
            accept={req.format?.toLowerCase()}
            helpText={req.helpText}
          />

          {/* Show validation rules */}
          {req.validationRules && req.validationRules.length > 0 && (
            <div className="mt-2 text-sm">
              <h4 className="font-medium mb-1">Validation Rules:</h4>
              <ul className="space-y-1">
                {req.validationRules.map((rule: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      rule.type === 'strict' ? 'bg-red-500' :
                      rule.type === 'soft' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className={
                      rule.type === 'strict' ? 'text-red-700' :
                      rule.type === 'soft' ? 'text-yellow-700' : 'text-blue-700'
                    }>
                      {rule.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CertificateDetails type={req.type} />
        </div>
      ))}      {showNaming && (
        <NamingPopup
          onSubmit={handleNamingSubmit}
          onCancel={() => setShowNaming(false)}
        />
      )}

      {showPreview && (
        <ZipPreviewModal
          files={previewFiles}
          onConfirm={async () => {
            const result = await generateZip(previewFiles, schema);
            if (result.success && result.blob) {
              // Create download link
              const url = URL.createObjectURL(result.blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `documents_${new Date().toISOString().split('T')[0]}.zip`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast.success('ZIP downloaded successfully!');
            } else {
              toast.error(`Download failed: ${result.error || 'Unknown error'}`);
            }
            setShowPreview(false);
          }}
          onCancel={() => setShowPreview(false)}
        />
      )}

      <CompletionButtons
        allUploaded={allUploaded}
        onNext={() => setShowNaming(true)}
      />
    </div>
  );
}
