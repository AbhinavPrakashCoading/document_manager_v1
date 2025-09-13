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

function getDefaultRequirements(schema: ExamSchema): DocumentRequirement[] {
  if (schema.requirements) {
    return schema.requirements;
  }
  
  // Fallback to older schema format
  return (schema.properties?.documents?.items?.properties?.type?.enum || []).map((type) => ({
    type,
    format: 'image/jpeg',  // Default format
    maxSizeKB: 1024,      // Default max size
    dimensions: '200x200'  // Default dimensions
  }));
}

export function UploadForm({ schema }: { schema: ExamSchema }) {
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
        <div key={req.type}>
          <UploadField
            label={req.type}
            required={true}
            onUpload={(file) => onFileUpload(req.type, file as File)}
            uploaded={uploadedTypes[req.type] || false}
          />
          <CertificateDetails type={req.type} />
        </div>
      ))}

      {showNaming && (
        <NamingPopup
          onSubmit={handleNamingSubmit}
          onCancel={() => setShowNaming(false)}
        />
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

      <CompletionButtons
        allUploaded={allUploaded}
        onNext={() => setShowNaming(true)}
      />
    </div>
  );
}
