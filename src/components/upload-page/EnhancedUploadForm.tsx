/**
 * Enhanced Upload Form with Intelligent Image Analysis
 * Integrates real-time image quality feedback with schema validation
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Camera,
  RotateCw,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ExamSchema, EnhancedDocumentRequirement } from '@/features/exam/examSchema';
import { enhancedSchemaValidator, EnhancedValidationResult } from '@/features/schema/EnhancedSchemaValidator';
import { ImageQualityFeedback, ImageQualityIndicator } from '@/components/ImageQualityFeedback';

interface EnhancedFileUpload {
  id: string;
  file: File;
  requirement: EnhancedDocumentRequirement;
  status: 'analyzing' | 'valid' | 'invalid' | 'warning';
  validation?: EnhancedValidationResult;
  previewUrl?: string;
  uploadProgress: number;
}

interface EnhancedUploadFormProps {
  schema: ExamSchema;
  onFilesValidated?: (files: EnhancedFileUpload[]) => void;
  onValidationComplete?: (allValid: boolean, files: EnhancedFileUpload[]) => void;
  className?: string;
}

export const EnhancedUploadForm: React.FC<EnhancedUploadFormProps> = ({
  schema,
  onFilesValidated,
  onValidationComplete,
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<EnhancedFileUpload[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draggedRequirement, setDraggedRequirement] = useState<string | null>(null);
  const [showQualityDetails, setShowQualityDetails] = useState<Record<string, boolean>>({});

  // Handle file drop/selection for specific requirement
  const handleFileDrop = useCallback(async (
    acceptedFiles: File[], 
    requirement: EnhancedDocumentRequirement
  ) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0]; // Single file per requirement
    const fileId = `${requirement.id}-${Date.now()}`;

    // Create preview URL for images
    let previewUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    // Add file to state with analyzing status
    const newUpload: EnhancedFileUpload = {
      id: fileId,
      file,
      requirement,
      status: 'analyzing',
      previewUrl,
      uploadProgress: 100 // Assume upload is instant for demo
    };

    setUploadedFiles(prev => {
      // Remove any existing file for this requirement
      const filtered = prev.filter(f => f.requirement.id !== requirement.id);
      return [...filtered, newUpload];
    });

    setIsAnalyzing(true);

    try {
      // Enhanced validation with image analysis
      const validation = await enhancedSchemaValidator.validateWithImageAnalysis(
        file,
        requirement,
        schema,
        {
          enableImageAnalysis: true,
          strictMode: false, // Can be made configurable
        }
      );

      // Determine status based on validation results
      let status: EnhancedFileUpload['status'] = 'valid';
      if (!validation.isValid) {
        status = 'invalid';
      } else if (validation.warnings.length > 0 || !validation.overallQuality.canProceed) {
        status = 'warning';
      }

      // Update file with validation results
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status, validation }
          : f
      ));

      // Show appropriate toast notification
      if (status === 'valid') {
        toast.success(`✅ ${requirement.displayName} validated successfully!`, {
          duration: 3000,
        });
      } else if (status === 'warning') {
        toast.custom((t) => (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900">
                  {requirement.displayName} has quality issues
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Score: {validation.overallQuality.score}/10 - Consider improving quality
                </div>
              </div>
            </div>
          </div>
        ), { duration: 5000 });
      } else {
        toast.error(`❌ ${requirement.displayName} validation failed`, {
          duration: 4000,
        });
      }

    } catch (error) {
      console.error('Validation failed:', error);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'invalid' }
          : f
      ));

      toast.error(`Failed to validate ${requirement.displayName}`);
    } finally {
      setIsAnalyzing(false);
      
      // Check if all required files are uploaded and call validation complete
      setTimeout(() => {
        const currentFiles = uploadedFiles.filter(f => f.id !== fileId);
        const allFiles = [...currentFiles, newUpload];
        const allValid = allFiles.every(f => f.status === 'valid' || f.status === 'warning');
        onValidationComplete?.(allValid, allFiles);
      }, 100);
    }

  }, [schema, uploadedFiles, onValidationComplete]);

  // Remove uploaded file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Toggle quality details visibility
  const toggleQualityDetails = useCallback((fileId: string) => {
    setShowQualityDetails(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  }, []);

  // File upload component for each requirement
  const RequirementUpload: React.FC<{ requirement: EnhancedDocumentRequirement }> = ({ 
    requirement 
  }) => {
    const existingFile = uploadedFiles.find(f => f.requirement.id === requirement.id);
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: requirement.format ? {
        [`image/${requirement.format.toLowerCase()}`]: []
      } : {
        'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      },
      maxFiles: 1,
      maxSize: requirement.maxSizeKB ? requirement.maxSizeKB * 1024 : undefined,
      onDrop: (files) => handleFileDrop(files, requirement),
      disabled: isAnalyzing
    });

    const getStatusIcon = (status: EnhancedFileUpload['status']) => {
      switch (status) {
        case 'analyzing':
          return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
        case 'valid':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'invalid':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
      }
    };

    const getStatusColor = (status: EnhancedFileUpload['status']) => {
      switch (status) {
        case 'analyzing':
          return 'border-blue-300 bg-blue-50';
        case 'valid':
          return 'border-green-300 bg-green-50';
        case 'warning':
          return 'border-yellow-300 bg-yellow-50';
        case 'invalid':
          return 'border-red-300 bg-red-50';
      }
    };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-medium text-gray-900">{requirement.displayName}</h3>
            <p className="text-sm text-gray-600">{requirement.description}</p>
          </div>
          {requirement.mandatory && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>

        {/* Upload Area */}
        {!existingFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {isDragActive 
                ? `Drop ${requirement.displayName.toLowerCase()} here`
                : `Upload ${requirement.displayName.toLowerCase()}`
              }
            </p>
            <p className="text-xs text-gray-500">
              {requirement.format && `Format: ${requirement.format.toUpperCase()}`}
              {requirement.maxSizeKB && ` • Max: ${requirement.maxSizeKB}KB`}
              {requirement.dimensions && ` • Size: ${requirement.dimensions}`}
            </p>
          </div>
        ) : (
          /* Uploaded File Display */
          <div className={`border-2 rounded-lg p-4 ${getStatusColor(existingFile.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Preview */}
                {existingFile.previewUrl && (
                  <img
                    src={existingFile.previewUrl}
                    alt={existingFile.file.name}
                    className="w-16 h-16 object-cover rounded border"
                  />
                )}
                
                {/* File Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(existingFile.status)}
                    <span className="font-medium text-sm">{existingFile.file.name}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {Math.round(existingFile.file.size / 1024)}KB • {existingFile.file.type}
                  </div>

                  {/* Validation Status */}
                  {existingFile.validation && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {existingFile.validation.imageAnalysis && (
                            <ImageQualityIndicator 
                              result={existingFile.validation.imageAnalysis}
                              size="sm"
                            />
                          )}
                          <span className="text-xs font-medium">
                            Overall: {existingFile.validation.overallQuality.score}/10
                          </span>
                        </div>
                        
                        {existingFile.validation.imageAnalysis && (
                          <button
                            onClick={() => toggleQualityDetails(existingFile.id)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {showQualityDetails[existingFile.id] ? 'Hide' : 'Details'}
                          </button>
                        )}
                      </div>

                      {/* Quick Issues */}
                      {existingFile.validation.errors.length > 0 && (
                        <div className="text-xs text-red-700">
                          {existingFile.validation.errors.length} error(s)
                        </div>
                      )}
                      {existingFile.validation.warnings.length > 0 && (
                        <div className="text-xs text-yellow-700">
                          {existingFile.validation.warnings.length} warning(s)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top Recommendation */}
                  {existingFile.validation?.recommendations[0] && (
                    <div className="text-xs text-gray-600 mt-1 flex items-start space-x-1">
                      <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{existingFile.validation.recommendations[0].message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(existingFile.id)}
                className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detailed Analysis (Expandable) */}
            {showQualityDetails[existingFile.id] && existingFile.validation?.imageAnalysis && (
              <div className="mt-4 border-t pt-4">
                <ImageQualityFeedback
                  result={existingFile.validation.imageAnalysis}
                  fileName={existingFile.file.name}
                  showDetails={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {requirement.helpText && (
          <p className="text-xs text-gray-500 mt-2">{requirement.helpText}</p>
        )}

        {/* Common Mistakes */}
        {requirement.commonMistakes && requirement.commonMistakes.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <span className="font-medium">Avoid: </span>
            {requirement.commonMistakes.join(', ')}
          </div>
        )}
      </div>
    );
  };

  // Calculate overall progress
  const totalRequirements = schema.requirements.filter(r => r.mandatory).length;
  const completedRequirements = uploadedFiles.filter(f => 
    f.requirement.mandatory && (f.status === 'valid' || f.status === 'warning')
  ).length;
  const progressPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Required Documents
            </h2>
            <p className="text-gray-600">
              AI-powered validation ensures your documents meet all requirements
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {completedRequirements}/{totalRequirements}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Upload Areas */}
      <div className="space-y-6">
        {schema.requirements
          .filter(req => req.mandatory)
          .map((requirement) => (
            <RequirementUpload 
              key={requirement.id} 
              requirement={requirement}
            />
          ))}
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span className="text-sm">Analyzing image quality...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUploadForm;