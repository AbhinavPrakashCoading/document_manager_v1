/**
 * OCR Component for extracting text from images
 * Integrates with existing document processing workflow
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { ocrService, OCRResult, OCROptions } from '@/features/ocr/OCRService';
import { hybridStorage } from '@/features/storage/HybridStorageService';

interface OCRComponentProps {
  onTextExtracted?: (results: Array<{ file: File; text: string; confidence: number }>) => void;
  className?: string;
  maxFiles?: number;
  showLanguageSelector?: boolean;
  showPreprocessingOptions?: boolean;
}

interface ExtractedResult {
  id: string;
  file: File;
  result: OCRResult;
  previewUrl: string;
  extractedAt: Date;
}

export const OCRComponent: React.FC<OCRComponentProps> = ({
  onTextExtracted,
  className = '',
  maxFiles = 10,
  showLanguageSelector = true,
  showPreprocessingOptions = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedResults, setExtractedResults] = useState<ExtractedResult[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['eng']);
  const [preprocessing, setPreprocessing] = useState({
    enhanceContrast: true,
    removeNoise: false,
    sharpen: false,
    threshold: undefined as number | undefined,
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supportedLanguages = ocrService.getSupportedLanguages();

  // Image file types that OCR can process
  const acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp']
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptedFileTypes,
    maxFiles,
    onDrop: handleFileDrop,
    disabled: isProcessing,
  });

  async function handleFileDrop(files: File[]) {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const newResults: ExtractedResult[] = [];
    
    try {
      const ocrOptions: OCROptions = {
        languages: selectedLanguages,
        preserveInterword: true,
        rotateAuto: true,
      };

      for (const file of files) {
        try {
          // Preprocess image if options are enabled
          let processedFile = file;
          if (preprocessing.enhanceContrast || preprocessing.removeNoise || 
              preprocessing.sharpen || preprocessing.threshold !== undefined) {
            processedFile = await ocrService.preprocessImage(file, preprocessing);
          }

          // Extract text using OCR
          const result = await ocrService.processImage(processedFile, ocrOptions);
          
          // Create result entry
          const extractedResult: ExtractedResult = {
            id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: file,
            result,
            previewUrl: URL.createObjectURL(file),
            extractedAt: new Date(),
          };

          newResults.push(extractedResult);

          // Store in hybrid storage for persistence
          if (result.text.trim()) {
            // Create a file from the extracted text
            const textFile = new File(
              [result.text], 
              `OCR_${file.name}.txt`, 
              { type: 'text/plain' }
            );
            
            const ocrMetadata = {
              originalFileName: file.name,
              originalFileType: file.type,
              ocrConfidence: result.confidence,
              languages: selectedLanguages,
              extractedAt: extractedResult.extractedAt.toISOString(),
              wordCount: result.words?.length || 0,
              processingType: 'ocr-extraction',
            };

            await hybridStorage.storeDocument(textFile, ocrMetadata);
          }

        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast.error(`Failed to extract text from ${file.name}`);
        }
      }

      // Update results
      setExtractedResults(prev => [...prev, ...newResults]);
      setActiveTab('results');

      // Notify parent component
      if (onTextExtracted && newResults.length > 0) {
        onTextExtracted(newResults.map(r => ({
          file: r.file,
          text: r.result.text,
          confidence: r.result.confidence,
        })));
      }

      toast.success(
        `Successfully extracted text from ${newResults.length} image(s)!`,
        { icon: '🎉', duration: 4000 }
      );

    } catch (error) {
      console.error('OCR processing failed:', error);
      toast.error('OCR processing failed');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleLanguageChange = (langCode: string, checked: boolean) => {
    if (checked) {
      setSelectedLanguages(prev => [...prev, langCode]);
    } else {
      setSelectedLanguages(prev => prev.filter(lang => lang !== langCode));
    }
  };

  const downloadAllText = () => {
    if (extractedResults.length === 0) return;

    const allText = extractedResults
      .map(result => `=== ${result.file.name} ===\nConfidence: ${result.result.confidence.toFixed(1)}%\nExtracted: ${result.extractedAt.toLocaleString()}\n\n${result.result.text}\n\n`)
      .join('');

    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('All extracted text downloaded!', { icon: '📄' });
  };

  const clearResults = () => {
    // Clean up preview URLs
    extractedResults.forEach(result => {
      URL.revokeObjectURL(result.previewUrl);
    });
    setExtractedResults([]);
    setActiveTab('upload');
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      extractedResults.forEach(result => {
        URL.revokeObjectURL(result.previewUrl);
      });
    };
  }, []);

  async function generateFileHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👁️</span>
            <h2 className="text-xl font-bold text-white">OCR Text Extraction</h2>
          </div>
          <div className="text-sm text-indigo-100">
            Free • Offline • Multi-language
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-indigo-200 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Upload Images
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'results'
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-indigo-200 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Results
            {extractedResults.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-indigo-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {extractedResults.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'upload' && (
          <>
            {/* Language Selection */}
            {showLanguageSelector && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Languages</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {supportedLanguages.slice(0, 12).map((lang) => (
                    <label
                      key={lang.code}
                      className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={(e) => handleLanguageChange(lang.code, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </label>
                  ))}
                </div>
                {selectedLanguages.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">Please select at least one language</p>
                )}
              </div>
            )}

            {/* Preprocessing Options */}
            {showPreprocessingOptions && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Enhancement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preprocessing.enhanceContrast}
                      onChange={(e) => setPreprocessing(prev => ({ ...prev, enhanceContrast: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enhance Contrast</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preprocessing.removeNoise}
                      onChange={(e) => setPreprocessing(prev => ({ ...prev, removeNoise: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Remove Noise</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preprocessing.sharpen}
                      onChange={(e) => setPreprocessing(prev => ({ ...prev, sharpen: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Sharpen Image</span>
                  </label>
                  <div className="flex items-center space-x-2 text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preprocessing.threshold !== undefined}
                        onChange={(e) => setPreprocessing(prev => ({ 
                          ...prev, 
                          threshold: e.target.checked ? 128 : undefined 
                        }))}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Threshold:</span>
                    </label>
                    {preprocessing.threshold !== undefined && (
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={preprocessing.threshold}
                        onChange={(e) => setPreprocessing(prev => ({ 
                          ...prev, 
                          threshold: parseInt(e.target.value) 
                        }))}
                        className="w-20"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : isProcessing
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <input {...getInputProps()} />
              
              {isProcessing ? (
                <div className="space-y-3">
                  <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600">Processing images with OCR...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">📷</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop images here' : 'Upload images for text extraction'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Drag & drop or click to select images (PNG, JPG, GIF, etc.)
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Max {maxFiles} files • Free offline processing • {selectedLanguages.length} language(s) selected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Extracted Results ({extractedResults.length})
              </h3>
              {extractedResults.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={downloadAllText}
                    className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    📄 Download All
                  </button>
                  <button
                    onClick={clearResults}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
              )}
            </div>

            {/* Results List */}
            {extractedResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-500">No text extracted yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload images to start extracting text</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {extractedResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={result.previewUrl}
                          alt={result.file.name}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.file.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.result.confidence >= 80
                                ? 'bg-green-100 text-green-800'
                                : result.result.confidence >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.result.confidence.toFixed(1)}% confident
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mb-3">
                          Extracted: {result.extractedAt.toLocaleString()} • 
                          Words: {result.result.words?.length || 0} • 
                          Languages: {selectedLanguages.join(', ')}
                        </div>

                        {/* Extracted Text */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-sm text-gray-900 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {result.result.text.trim() || 'No text detected'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default OCRComponent;