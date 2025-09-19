'use client';

import { useState, useEffect } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ExamSchema } from '@/features/exam/examSchema';
import { generateZip } from '@/features/package/zipService';
import { FileWithMeta } from '@/features/package/types';
import { ZipPreviewModal } from '../ZipPreviewModal';
import { NamingPopup } from './NamingPopup';
import { UploadField } from './UploadField';
import { CertificateDetails } from './CertificateDetails';
import { CompletionButtons } from './CompletionButtons';
import { UserNameInput } from './UserNameInput';
import { DraftStatus, DraftRecoveryBanner } from '@/components/draft/DraftStatus';
import { DraftRecoveryModal } from '@/components/draft/DraftRecoveryModal';
import { addDOPBand, canAddDOPBand } from '@/utils/dopBand';
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
  const [previewFiles, setPreviewFiles] = useState<any[]>([]);
  const requirements = getDefaultRequirements(schema);
  const [uploadedTypes, setUploadedTypes] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState('');
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [rollNumber, setRollNumber] = useState('');

  // Initialize auto-save
  const {
    formData,
    status: autoSaveStatus,
    updateFormData,
    addFile,
    forceSave,
    clearDraft,
    restoreDraft,
    hasUnsavedChanges,
  } = useAutoSave({
    examId: schema.examId || 'unknown',
    enabled: true,
    onError: (error) => {
      console.error('Auto-save error:', error);
      toast.error(`Auto-save failed: ${error}`);
    },
    onSave: (draft) => {
      console.log('Draft saved:', draft);
    },
    onRestore: (draft) => {
      // Restore form state from draft
      if (draft.formData.rollNumber) {
        setRollNumber(draft.formData.rollNumber);
      }
      if (draft.formData.personalInfo?.name) {
        setUserName(draft.formData.personalInfo.name);
      }
      // Show recovery notification
      setShowDraftRecovery(true);
      toast.success('Draft restored successfully');
    },
  });

  // Initialize form data on mount
  useEffect(() => {
    const initializeForm = async () => {
      // Check for existing draft and show recovery options
      const storedRoll = localStorage.getItem('rollNumber');
      if (storedRoll && !rollNumber) {
        setRollNumber(storedRoll);
      }
    };

    initializeForm();
  }, [rollNumber]);

  // Auto-save form data changes
  useEffect(() => {
    updateFormData({
      rollNumber,
      personalInfo: {
        name: userName,
      },
      uploadProgress: {
        totalFiles: requirements.length,
        uploadedFiles: Object.values(uploadedTypes).filter(Boolean).length,
        validFiles: files.filter(file => !results[file.name]?.length).length,
        currentStep: showPreview ? 'review' : showNaming ? 'validation' : 'upload',
      },
    });
  }, [rollNumber, userName, uploadedTypes, files, results, requirements.length, showPreview, showNaming, updateFormData]);

  const onFileUpload = async (type: string, file: File | null, dopData?: { date: string; enabled: boolean; addBand?: boolean }) => {
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

      let processedFile = file;

      // Add DOP band to image if requested
      if (dopData && dopData.enabled && dopData.addBand && userName.trim()) {
        if (canAddDOPBand(file)) {
          try {
            toast.loading('🖼️ Adding DOP band to photo...', { id: 'dop-band' });
            processedFile = await addDOPBand(file, {
              userName: userName.trim(),
              dateOfPhotography: dopData.date
            });
            toast.success('✅ DOP band added to photo', { id: 'dop-band' });
          } catch (error) {
            console.error('DOP band error:', error);
            toast.error('⚠️ Failed to add DOP band, using original photo', { id: 'dop-band' });
          }
        } else {
          toast.error('❌ DOP band only supported for JPEG/PNG images');
        }
      }

      // Transform the file first
      const transformed = await transformFile(processedFile as File, matchedReq);
      
      // Add DOP metadata if provided (even if band wasn't added)
      if (dopData && dopData.enabled) {
        // Store DOP metadata in a way that can be retrieved later
        (transformed as any).dopMetadata = {
          date: dopData.date,
          formatted: new Date(dopData.date).toLocaleDateString(),
          type: 'date_of_photography',
          bandAdded: dopData.addBand && userName.trim() && canAddDOPBand(file),
          userName: userName.trim()
        };
        
        console.log(`📅 DOP set for ${type}:`, dopData.date);
        if (!dopData.addBand) {
          toast.success(`📅 Date of Photography set: ${new Date(dopData.date).toLocaleDateString()}`);
        }
      }
      
      // Handle the upload and check for validation errors
      handleUpload(transformed);
      
      // Add file to auto-save draft
      await addFile(type, transformed);
      
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
    // Update auto-save data
    setRollNumber(data.roll);
    setUserName(data.name);
    
    // Save roll number to localStorage for persistence
    localStorage.setItem('rollNumber', data.roll);
    
    const validFiles = files.filter(file => {
      const type = requirements.find(r => 
        file.name.toLowerCase().includes(r.type.toLowerCase())
      )?.type;
      return type && !results[file.name]?.length;
    });

    const fileWithMeta: any[] = validFiles.map(file => {
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
    
    // Force save draft with updated data
    await forceSave();
  };

  const allUploaded = requirements.every(
    (req: DocumentRequirement) => uploadedTypes[req.type]
  );

  return (
    <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
      {/* Draft Recovery Banner */}
      {showDraftRecovery && (
        <DraftRecoveryBanner
          onRestore={restoreDraft}
          onDismiss={() => setShowDraftRecovery(false)}
          draftDate={formData.uploadProgress ? new Date() : undefined}
          className="mb-4"
        />
      )}

      {/* Auto-save Status */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Upload Documents</h2>
        <DraftStatus
          status={autoSaveStatus}
          onForceSave={forceSave}
          onRestore={() => setShowRecoveryModal(true)}
          className="text-xs"
        />
      </div>

      {/* User Name Input - Always at the top */}
      <UserNameInput 
        value={userName}
        onChange={setUserName}
        required={true}
      />
      
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
            onUpload={(file, dopData) => onFileUpload(req.type, file as File, dopData)}
            uploaded={uploadedTypes[req.type] || false}
            accept={req.format?.toLowerCase()}
            helpText={req.helpText}
            fieldType={req.type || req.id || ''}
            userName={userName}
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

      {/* Draft Recovery Modal */}
      {showRecoveryModal && (
        <DraftRecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          onRestore={(draft) => {
            // Restore form data from selected draft
            if (draft.formData.rollNumber) setRollNumber(draft.formData.rollNumber);
            if (draft.formData.personalInfo?.name) setUserName(draft.formData.personalInfo.name);
            toast.success('Draft restored successfully');
          }}
          onStartFresh={async () => {
            await clearDraft();
            setRollNumber('');
            setUserName('');
            setUploadedTypes({});
            toast.success('Started with fresh form');
          }}
          examId={schema.examId || 'unknown'}
        />
      )}

      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-400 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-amber-800 font-medium">You have unsaved changes</p>
          <p className="text-xs text-amber-600">Changes are being auto-saved</p>
        </div>
      )}
    </div>
  );
}
