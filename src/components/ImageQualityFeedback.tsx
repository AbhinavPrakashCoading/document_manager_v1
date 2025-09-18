/**
 * Image Quality Feedback Component
 * Provides real-time visual feedback on image quality issues
 */

'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Sun, 
  Contrast,
  RotateCw,
  AlertTriangle,
  Info,
  Camera,
  Lightbulb
} from 'lucide-react';
import { ImageAnalysisResult } from '@/features/image-analysis/ImageAnalysisService';

interface ImageQualityFeedbackProps {
  result: ImageAnalysisResult | null;
  fileName?: string;
  className?: string;
  showDetails?: boolean;
}

export const ImageQualityFeedback: React.FC<ImageQualityFeedbackProps> = ({
  result,
  fileName = 'Image',
  className = '',
  showDetails = true
}) => {
  if (!result) return null;

  const getOverallStatusIcon = () => {
    switch (result.overall.status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unusable':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getOverallStatusColor = () => {
    switch (result.overall.status) {
      case 'excellent':
        return 'border-green-200 bg-green-50';
      case 'good':
        return 'border-blue-200 bg-blue-50';
      case 'poor':
        return 'border-yellow-200 bg-yellow-50';
      case 'unusable':
        return 'border-red-200 bg-red-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-blue-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const QualityCheck: React.FC<{
    icon: React.ReactNode;
    title: string;
    score: number;
    message: string;
    status: 'good' | 'warning' | 'error';
  }> = ({ icon, title, score, message, status }) => {
    const statusColors = {
      good: 'text-green-700 bg-green-100 border-green-200',
      warning: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      error: 'text-red-700 bg-red-100 border-red-200'
    };

    return (
      <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          <span className={`font-bold text-sm ${getScoreColor(score)}`}>
            {score}/10
          </span>
        </div>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    );
  };

  const getCheckStatus = (score: number, isUsable: boolean): 'good' | 'warning' | 'error' => {
    if (!isUsable) return 'error';
    if (score >= 7) return 'good';
    return 'warning';
  };

  return (
    <div className={`bg-white rounded-xl border-2 ${getOverallStatusColor()} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getOverallStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">
              Image Quality Analysis
            </h3>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${getScoreColor(result.overall.score)}`}>
            {result.overall.score}/10
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {result.overall.status}
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-3 rounded-lg mb-4 ${
        result.overall.canProceed 
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        <div className="flex items-center space-x-2">
          {result.overall.canProceed ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">
            {result.overall.canProceed 
              ? 'Image can be processed' 
              : 'Image needs improvement before processing'
            }
          </span>
        </div>
      </div>

      {/* Detailed Analysis */}
      {showDetails && (
        <div className="space-y-3">
          {/* File Health Check */}
          {result.fileHealth.isCorrupted && (
            <QualityCheck
              icon={<AlertCircle className="w-4 h-4" />}
              title="File Health"
              score={result.fileHealth.isComplete ? 10 : 0}
              message={result.fileHealth.message}
              status="error"
            />
          )}

          {/* Blur Check */}
          <QualityCheck
            icon={<Eye className="w-4 h-4" />}
            title="Sharpness"
            score={result.blur.score}
            message={result.blur.message}
            status={result.blur.isBlurry ? 'error' : 'good'}
          />

          {/* Brightness Check */}
          <QualityCheck
            icon={<Sun className="w-4 h-4" />}
            title="Brightness"
            score={result.brightness.score}
            message={result.brightness.message}
            status={getCheckStatus(result.brightness.score, result.brightness.isUsable)}
          />

          {/* Contrast Check */}
          <QualityCheck
            icon={<Contrast className="w-4 h-4" />}
            title="Contrast"
            score={result.contrast.score}
            message={result.contrast.message}
            status={getCheckStatus(result.contrast.score, result.contrast.isUsable)}
          />

          {/* Orientation Check */}
          {result.orientation.needsRotation && (
            <QualityCheck
              icon={<RotateCw className="w-4 h-4" />}
              title="Orientation"
              score={result.orientation.needsRotation ? 3 : 10}
              message={result.orientation.message}
              status="warning"
            />
          )}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 text-sm mb-1">
                Suggestions for improvement:
              </h4>
              <ul className="space-y-1">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Analysis completed in {result.processingTime}ms</span>
          <span>Confidence: {Math.round(result.overall.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

// Quick status indicator for minimal UI
export const ImageQualityIndicator: React.FC<{
  result: ImageAnalysisResult | null;
  size?: 'sm' | 'md' | 'lg';
}> = ({ result, size = 'md' }) => {
  if (!result) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const getStatusIndicator = () => {
    if (!result.overall.canProceed) {
      return <AlertCircle className={`${sizeClasses[size]} text-red-500`} />;
    }
    
    switch (result.overall.status) {
      case 'excellent':
        return <CheckCircle className={`${sizeClasses[size]} text-green-500`} />;
      case 'good':
        return <CheckCircle className={`${sizeClasses[size]} text-blue-500`} />;
      case 'poor':
        return <AlertTriangle className={`${sizeClasses[size]} text-yellow-500`} />;
      default:
        return <AlertCircle className={`${sizeClasses[size]} text-red-500`} />;
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {getStatusIndicator()}
      <span className={`font-medium ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      } ${getScoreColor(result.overall.score)}`}>
        {result.overall.score}/10
      </span>
    </div>
  );
};

// Helper function for score colors
const getScoreColor = (score: number) => {
  if (score >= 7) return 'text-green-600';
  if (score >= 5) return 'text-blue-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

export default ImageQualityFeedback;