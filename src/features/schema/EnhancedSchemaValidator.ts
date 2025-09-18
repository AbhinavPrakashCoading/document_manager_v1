/**
 * Enhanced Schema Validation with Image Analysis
 * Integrates intelligent image analysis with existing schema validation
 */

'use client';

import { 
  ExamSchema, 
  EnhancedDocumentRequirement, 
  ValidationRule 
} from '@/features/exam/examSchema';
import { imageAnalysisService, ImageAnalysisResult } from '@/features/image-analysis/ImageAnalysisService';
import toast from 'react-hot-toast';

export interface EnhancedValidationResult {
  // Original validation results
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  
  // Enhanced with image analysis
  imageAnalysis?: ImageAnalysisResult;
  overallQuality: {
    score: number; // Combined schema compliance + image quality
    canProceed: boolean;
    confidence: number;
  };
  
  // Enhanced recommendations
  recommendations: EnhancedRecommendation[];
  processingTime: number;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  canOverride: boolean;
  source: 'schema' | 'image-analysis' | 'file-health';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
  source: 'schema' | 'image-analysis';
}

export interface EnhancedRecommendation {
  type: 'technical' | 'usability' | 'quality' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  source: 'schema' | 'image-analysis' | 'combined';
}

class EnhancedSchemaValidator {
  
  /**
   * Validate a file against schema requirements WITH image analysis
   */
  async validateWithImageAnalysis(
    file: File,
    requirement: EnhancedDocumentRequirement,
    schema: ExamSchema,
    options: {
      enableImageAnalysis: boolean;
      strictMode: boolean;
      skipImageAnalysis?: boolean;
    } = { enableImageAnalysis: true, strictMode: false }
  ): Promise<EnhancedValidationResult> {
    
    const startTime = Date.now();
    const result: EnhancedValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      overallQuality: { score: 0, canProceed: false, confidence: 0 },
      recommendations: [],
      processingTime: 0
    };

    try {
      // Step 1: Traditional schema validation
      const schemaValidation = await this.performSchemaValidation(file, requirement, options.strictMode);
      result.errors.push(...schemaValidation.errors);
      result.warnings.push(...schemaValidation.warnings);

      // Step 2: Image analysis (if enabled and file is an image)
      if (options.enableImageAnalysis && !options.skipImageAnalysis && this.isImageFile(file)) {
        try {
          const analysisOptions = {
            checkBlur: true,
            checkBrightness: true,
            checkContrast: true,
            checkOrientation: this.shouldCheckOrientation(requirement),
            checkFileHealth: true,
            strictMode: options.strictMode,
            documentType: this.getDocumentType(requirement)
          };

          result.imageAnalysis = await imageAnalysisService.analyzeImage(file, analysisOptions);
          
          // Convert image analysis results to validation errors/warnings
          const imageValidation = this.convertImageAnalysisToValidation(result.imageAnalysis, requirement);
          result.errors.push(...imageValidation.errors);
          result.warnings.push(...imageValidation.warnings);

        } catch (error) {
          console.error('Image analysis failed:', error);
          result.warnings.push({
            field: requirement.id,
            message: 'Image analysis could not be performed',
            suggestion: 'Manual review may be needed',
            source: 'image-analysis'
          });
        }
      }

      // Step 3: Calculate overall quality score
      result.overallQuality = this.calculateOverallQuality(
        schemaValidation.schemaScore,
        result.imageAnalysis,
        options.strictMode
      );

      // Step 4: Generate enhanced recommendations
      result.recommendations = this.generateEnhancedRecommendations(
        result,
        requirement,
        options.strictMode
      );

      // Step 5: Determine if validation passes
      result.isValid = result.errors.filter(e => e.severity === 'error').length === 0;
      result.processingTime = Date.now() - startTime;

      return result;

    } catch (error) {
      console.error('Enhanced validation failed:', error);
      
      result.errors.push({
        field: requirement.id,
        rule: 'validation_error',
        message: 'Validation process failed',
        severity: 'error',
        canOverride: false,
        source: 'schema'
      });
      
      result.isValid = false;
      result.processingTime = Date.now() - startTime;
      
      return result;
    }
  }

  /**
   * Perform traditional schema-based validation
   */
  private async performSchemaValidation(
    file: File,
    requirement: EnhancedDocumentRequirement,
    strictMode: boolean
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    schemaScore: number;
  }> {
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let schemaScore = 10; // Start with perfect score

    // File size validation
    if (requirement.maxSizeKB && file.size > requirement.maxSizeKB * 1024) {
      errors.push({
        field: requirement.id,
        rule: 'file_size',
        message: `File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed (${requirement.maxSizeKB}KB)`,
        severity: 'error',
        canOverride: false,
        source: 'schema'
      });
      schemaScore -= 3;
    }

    // Format validation
    if (requirement.format && !this.isValidFormat(file, requirement.format)) {
      errors.push({
        field: requirement.id,
        rule: 'file_format',
        message: `File format must be ${requirement.format}`,
        severity: 'error',
        canOverride: false,
        source: 'schema'
      });
      schemaScore -= 2;
    }

    // Apply custom validation rules
    for (const rule of requirement.validationRules) {
      const ruleResult = await this.applyValidationRule(file, rule, requirement);
      if (!ruleResult.passed) {
        if (rule.type === 'strict') {
          errors.push({
            field: requirement.id,
            rule: rule.rule,
            message: rule.message,
            severity: 'error',
            canOverride: rule.canOverride,
            source: 'schema'
          });
          schemaScore -= 2;
        } else if (rule.type === 'soft' && strictMode) {
          warnings.push({
            field: requirement.id,
            message: rule.message,
            suggestion: 'Consider addressing this issue for better compliance',
            source: 'schema'
          });
          schemaScore -= 0.5;
        }
      }
    }

    return {
      errors,
      warnings,
      schemaScore: Math.max(0, schemaScore)
    };
  }

  /**
   * Convert image analysis results to validation format
   */
  private convertImageAnalysisToValidation(
    analysis: ImageAnalysisResult,
    requirement: EnhancedDocumentRequirement
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // File health errors (critical)
    if (analysis.fileHealth.isCorrupted) {
      errors.push({
        field: requirement.id,
        rule: 'file_health',
        message: analysis.fileHealth.message,
        severity: 'error',
        canOverride: false,
        source: 'image-analysis'
      });
    }

    // Image quality issues
    if (!analysis.overall.canProceed) {
      errors.push({
        field: requirement.id,
        rule: 'image_quality',
        message: `Image quality is too poor (${analysis.overall.score}/10) for processing`,
        severity: 'error',
        canOverride: true,
        source: 'image-analysis'
      });
    }

    // Blur warnings/errors
    if (analysis.blur.isBlurry) {
      const severity = analysis.blur.severity === 'severe' ? 'error' : 'warning';
      if (severity === 'error') {
        errors.push({
          field: requirement.id,
          rule: 'image_blur',
          message: analysis.blur.message,
          severity: 'error',
          canOverride: true,
          source: 'image-analysis'
        });
      } else {
        warnings.push({
          field: requirement.id,
          message: analysis.blur.message,
          suggestion: 'Consider retaking the photo with better focus',
          source: 'image-analysis'
        });
      }
    }

    // Brightness/contrast warnings
    if (!analysis.brightness.isUsable) {
      errors.push({
        field: requirement.id,
        rule: 'image_brightness',
        message: analysis.brightness.message,
        severity: 'error',
        canOverride: true,
        source: 'image-analysis'
      });
    }

    if (!analysis.contrast.isUsable) {
      warnings.push({
        field: requirement.id,
        message: analysis.contrast.message,
        suggestion: 'Ensure good lighting with adequate contrast',
        source: 'image-analysis'
      });
    }

    // Orientation warnings
    if (analysis.orientation.needsRotation) {
      warnings.push({
        field: requirement.id,
        message: analysis.orientation.message,
        suggestion: `Rotate image ${analysis.orientation.suggestedRotation} degrees`,
        source: 'image-analysis'
      });
    }

    return { errors, warnings };
  }

  /**
   * Calculate overall quality combining schema compliance and image analysis
   */
  private calculateOverallQuality(
    schemaScore: number,
    imageAnalysis?: ImageAnalysisResult,
    strictMode: boolean = false
  ): EnhancedValidationResult['overallQuality'] {
    
    let combinedScore = schemaScore;
    let canProceed = schemaScore >= 7;
    let confidence = 0.8; // Base confidence for schema validation

    if (imageAnalysis) {
      // Weighted average: 60% schema compliance, 40% image quality
      combinedScore = (schemaScore * 0.6) + (imageAnalysis.overall.score * 0.4);
      canProceed = canProceed && imageAnalysis.overall.canProceed;
      confidence = Math.min(confidence, imageAnalysis.overall.confidence);
    }

    // Adjust for strict mode
    if (strictMode) {
      canProceed = canProceed && combinedScore >= 8;
    }

    return {
      score: Math.round(combinedScore * 10) / 10,
      canProceed,
      confidence
    };
  }

  /**
   * Generate enhanced recommendations combining schema and image analysis insights
   */
  private generateEnhancedRecommendations(
    result: EnhancedValidationResult,
    requirement: EnhancedDocumentRequirement,
    strictMode: boolean
  ): EnhancedRecommendation[] {
    
    const recommendations: EnhancedRecommendation[] = [];

    // High priority: Critical errors
    const criticalErrors = result.errors.filter(e => e.severity === 'error' && !e.canOverride);
    if (criticalErrors.length > 0) {
      recommendations.push({
        type: 'compliance',
        priority: 'high',
        message: `${criticalErrors.length} critical issue(s) must be fixed before processing`,
        action: 'Fix file format, size, or corruption issues',
        source: 'combined'
      });
    }

    // Image quality recommendations
    if (result.imageAnalysis) {
      if (result.imageAnalysis.blur.isBlurry && result.imageAnalysis.blur.severity === 'severe') {
        recommendations.push({
          type: 'quality',
          priority: 'high',
          message: 'Image is too blurry for reliable processing',
          action: 'Retake photo with steady hands and good focus',
          source: 'image-analysis'
        });
      }

      if (!result.imageAnalysis.brightness.isUsable) {
        recommendations.push({
          type: 'technical',
          priority: 'high',
          message: 'Image lighting needs improvement',
          action: result.imageAnalysis.brightness.level === 'too-dark' 
            ? 'Use better lighting or flash' 
            : 'Reduce bright lighting or move away from light source',
          source: 'image-analysis'
        });
      }
    }

    // Usability recommendations
    if (requirement.category === 'photo' && result.overallQuality.score < 7) {
      recommendations.push({
        type: 'usability',
        priority: 'medium',
        message: 'Photo quality could be improved for better results',
        action: 'Ensure good lighting, sharp focus, and proper framing',
        source: 'combined'
      });
    }

    // Schema-specific recommendations
    if (requirement.helpText) {
      recommendations.push({
        type: 'compliance',
        priority: 'low',
        message: requirement.helpText,
        source: 'schema'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private shouldCheckOrientation(requirement: EnhancedDocumentRequirement): boolean {
    return requirement.category === 'identity' || requirement.category === 'certificate';
  }

  private getDocumentType(requirement: EnhancedDocumentRequirement): 'photo' | 'document' | 'signature' {
    switch (requirement.category) {
      case 'photo':
        return 'photo';
      case 'signature':
        return 'signature';
      default:
        return 'document';
    }
  }

  private isValidFormat(file: File, requiredFormat: string): boolean {
    const fileType = file.type.toLowerCase();
    const format = requiredFormat.toLowerCase();
    
    return fileType.includes(format) || 
           (format === 'jpeg' && (fileType.includes('jpg') || fileType.includes('jpeg')));
  }

  private async applyValidationRule(
    file: File,
    rule: ValidationRule,
    requirement: EnhancedDocumentRequirement
  ): Promise<{ passed: boolean; message?: string }> {
    
    // Apply specific validation rules based on rule type
    switch (rule.rule) {
      case 'file_size_limit':
        return { passed: file.size <= (requirement.maxSizeKB || Infinity) * 1024 };
      
      case 'photo_quality':
        // This would be handled by image analysis
        return { passed: true };
      
      default:
        return { passed: true };
    }
  }
}

// Export singleton instance
export const enhancedSchemaValidator = new EnhancedSchemaValidator();

export { EnhancedSchemaValidator };