// Enhanced Upload Section for Dashboard Integration
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  Download,
  Settings,
  Shield,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { schemaProcessingService } from '@/features/schema/SchemaProcessingService';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  requirements: string[];
}

const getTemplates = (): Template[] => [
  {
    id: 'upsc',
    name: 'UPSC Templates',
    description: 'Pre-configured for UPSC document requirements',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    icon: '🏛️',
    requirements: schemaProcessingService.getTemplateRequirements('upsc')
  },
  {
    id: 'ssc',
    name: 'SSC Templates', 
    description: 'Optimized for SSC examination documents',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    icon: '📝',
    requirements: schemaProcessingService.getTemplateRequirements('ssc')
  },
  {
    id: 'ielts',
    name: 'IELTS Templates',
    description: 'Designed for IELTS document validation',
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    icon: '🌐',
    requirements: schemaProcessingService.getTemplateRequirements('ielts')
  }
];

const templates = getTemplates();

interface EnhancedUploadSectionProps {
  onFilesUploaded?: (files: File[]) => void;
}

export const EnhancedUploadSection: React.FC<EnhancedUploadSectionProps> = ({ 
  onFilesUploaded 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  }, []);

  const handleFilesSelected = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(file => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        );
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'complete', progress: 100 }
              : f
          )
        );
      }, 1000);
    });

    toast.success(`${files.length} file(s) uploaded successfully!`);
    onFilesUploaded?.(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleTemplateSelect = (template: Template) => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload some files first!');
      return;
    }
    setSelectedTemplate(template);
    setShowPermissionModal(true);
  };

  const handleProcessWithTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const files = uploadedFiles.map(uf => uf.file);
      const result = await schemaProcessingService.processFiles(files, selectedTemplate.id);
      
      setShowPermissionModal(false);
      
      if (result.success) {
        toast.success(`Successfully processed ${result.validationReport.processedFiles} files!`);
        console.log('Processing result:', result);
      } else {
        toast.error(`Processing failed with ${result.errors.length} errors`);
        console.error('Processing errors:', result.errors);
      }
      
    } catch (error) {
      toast.error('Processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Processing error:', error);
      setShowPermissionModal(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-600 mt-1">
          Upload your exam documents, then choose a template for processing.
        </p>
      </div>

      {/* Enhanced Drag & Drop Zone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragOver 
            ? 'border-purple-400 bg-purple-50 scale-105' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
          dragOver ? 'text-purple-500' : 'text-gray-400'
        }`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {dragOver ? 'Drop your files here!' : 'Upload Documents'}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag & drop files here or click to browse
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105">
          Select Files
        </button>
        <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-500">
          <span>Supported: PDF, ZIP, DOC, JPG</span>
          <span>Max: 50MB</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept=".pdf,.zip,.doc,.docx,.jpg,.jpeg,.png"
      />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {uploadedFiles.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'complete' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Choose Processing Template
          </h3>
          {uploadedFiles.length === 0 && (
            <span className="text-sm text-gray-500">Upload files first</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              disabled={uploadedFiles.length === 0}
              className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
                uploadedFiles.length > 0
                  ? 'border-gray-200 hover:border-purple-300 cursor-pointer'
                  : 'border-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{template.icon}</span>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className={`w-full py-2 rounded-lg text-sm font-medium text-center transition-colors ${
                uploadedFiles.length > 0 ? template.bgColor + ' ' + template.color : 'bg-gray-100 text-gray-400'
              }`}>
                Process Documents
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Processing Permission
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              We're about to process your {uploadedFiles.length} document(s) using the{' '}
              <strong>{selectedTemplate.name}</strong> schema. This will:
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Validate document structure</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <Settings className="w-4 h-4 text-blue-500" />
                <span>Apply formatting rules</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Generate compliance report</span>
              </li>
            </ul>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessWithTemplate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Process Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};