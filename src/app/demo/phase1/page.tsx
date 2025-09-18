/**
 * Demo Page for Phase 1: Teaching the System to "See" Images
 * Interactive demonstration of intelligent image analysis capabilities
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Eye, 
  Brain, 
  Sparkles, 
  Camera, 
  RotateCw,
  Sun,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Download
} from 'lucide-react';

import { ImageAnalysisService, ImageAnalysisResult } from '@/features/image-analysis/ImageAnalysisService';
import { ImageQualityFeedback } from '@/components/ImageQualityFeedback';
import toast from 'react-hot-toast';

interface AnalyzedImage {
  id: string;
  file: File;
  previewUrl: string;
  analysis?: ImageAnalysisResult;
  isAnalyzing: boolean;
}

export default function Phase1DemoPage() {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const imageAnalysisService = useRef(new ImageAnalysisService());

  // Handle image drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages: AnalyzedImage[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isAnalyzing: true,
    }));

    setAnalyzedImages(prev => [...prev, ...newImages]);
    setIsAnalyzing(true);

    // Analyze each image
    for (const imageData of newImages) {
      try {
        const analysis = await imageAnalysisService.current.analyzeImage(imageData.file);
        
        setAnalyzedImages(prev => 
          prev.map(img => 
            img.id === imageData.id 
              ? { ...img, analysis, isAnalyzing: false }
              : img
          )
        );

        // Show result toast
        const score = analysis.overallScore;
        if (score >= 7) {
          toast.success(`✅ Great image quality! (${score}/10)`, { duration: 3000 });
        } else if (score >= 5) {
          toast.custom((t) => (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800">Moderate quality (${score}/10)</span>
              </div>
            </div>
          ), { duration: 4000 });
        } else {
          toast.error(`❌ Poor image quality (${score}/10)`, { duration: 4000 });
        }

      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalyzedImages(prev => 
          prev.map(img => 
            img.id === imageData.id 
              ? { ...img, isAnalyzing: false }
              : img
          )
        );
        toast.error('Analysis failed for image');
      }
    }

    setIsAnalyzing(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: 5
  });

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setAnalyzedImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter(img => img.id !== imageId);
    });
    
    if (selectedImageId === imageId) {
      setSelectedImageId(null);
    }
  }, [selectedImageId]);

  // Clear all images
  const clearAll = useCallback(() => {
    analyzedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setAnalyzedImages([]);
    setSelectedImageId(null);
  }, [analyzedImages]);

  // Get overall stats
  const stats = {
    total: analyzedImages.length,
    analyzing: analyzedImages.filter(img => img.isAnalyzing).length,
    excellent: analyzedImages.filter(img => img.analysis && img.analysis.overallScore >= 8).length,
    good: analyzedImages.filter(img => img.analysis && img.analysis.overallScore >= 6 && img.analysis.overallScore < 8).length,
    poor: analyzedImages.filter(img => img.analysis && img.analysis.overallScore < 6).length,
  };

  const selectedImage = selectedImageId ? analyzedImages.find(img => img.id === selectedImageId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Brain className="w-10 h-10 text-purple-600" />
              <Eye className="w-10 h-10 text-blue-600" />
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Phase 1: Teaching the System to "See" Images
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              AI-powered image quality analysis with real-time feedback
            </p>
            <p className="text-gray-500 mt-1">
              Upload images to see blur detection, brightness analysis, contrast checking, and orientation detection in action
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Images for Analysis
              </h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-full">
                      <ImageIcon className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop images here' : 'Upload images to analyze'}
                    </p>
                    <p className="text-gray-500 mt-1">
                      Supports JPEG, PNG, GIF, BMP, WebP • Max 5 images
                    </p>
                  </div>
                  <div className="flex justify-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>Blur Detection</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Sun className="w-4 h-4" />
                      <span>Brightness Analysis</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RotateCw className="w-4 h-4" />
                      <span>Orientation Check</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear All Button */}
              {analyzedImages.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearAll}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear All Images
                  </button>
                </div>
              )}
            </div>

            {/* Image Gallery */}
            {analyzedImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Analysis Results ({analyzedImages.length})
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {analyzedImages.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageId === image.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImageId(image.id)}
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        className="w-full h-32 object-cover"
                      />
                      
                      {/* Analysis Overlay */}
                      {image.isAnalyzing ? (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        </div>
                      ) : image.analysis && (
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                          <div className={`text-xs font-bold px-2 py-1 rounded ${
                            image.analysis.overallScore >= 8 
                              ? 'bg-green-500 text-white'
                              : image.analysis.overallScore >= 6
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {image.analysis.overallScore}/10
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                            className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Quality Indicators */}
                      {image.analysis && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex justify-between text-xs">
                            <div className="flex space-x-1">
                              {image.analysis.blurLevel.isBlurry && (
                                <div className="bg-red-500 text-white px-1 rounded">Blur</div>
                              )}
                              {(image.analysis.brightness.isTooBright || image.analysis.brightness.isTooDark) && (
                                <div className="bg-yellow-500 text-white px-1 rounded">Light</div>
                              )}
                              {image.analysis.needsRotation && (
                                <div className="bg-blue-500 text-white px-1 rounded">Rotate</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Analysis Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Images</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                
                {stats.analyzing > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">Analyzing</span>
                    <span className="font-medium text-blue-600">{stats.analyzing}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Excellent (8-10)</span>
                  <span className="font-medium text-green-600">{stats.excellent}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">Good (6-7)</span>
                  <span className="font-medium text-yellow-600">{stats.good}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Needs Work (&lt;6)</span>
                  <span className="font-medium text-red-600">{stats.poor}</span>
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                AI Analysis Features
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Blur Detection</div>
                    <div className="text-xs text-gray-500">Laplacian variance analysis</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Sun className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Brightness & Contrast</div>
                    <div className="text-xs text-gray-500">Pixel-level luminance analysis</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <RotateCw className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Orientation Detection</div>
                    <div className="text-xs text-gray-500">Text and edge analysis</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">File Health Check</div>
                    <div className="text-xs text-gray-500">Corruption and format validation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            {selectedImage && selectedImage.analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Detailed Analysis
                </h3>
                
                <ImageQualityFeedback
                  result={selectedImage.analysis}
                  fileName={selectedImage.file.name}
                  showDetails={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}