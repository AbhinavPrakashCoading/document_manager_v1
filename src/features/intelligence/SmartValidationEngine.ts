/**
 * Phase 2: Smart Validation Engine
 * Unified intelligence integration combining all AI systems for contextual document understanding
 */

'use client';

import { ImageAnalysisService, ImageAnalysisResult } from '../image-analysis/ImageAnalysisService';
import { FaceIntelligence, FaceAnalysis } from './FaceIntelligence';
import { TextIntelligence, TextExtraction } from './TextIntelligence';
import { DocumentClassifier, DocumentClassification } from './DocumentClassifier';
import { SignatureIntelligence, SignatureAnalysis } from './SignatureIntelligence';

export interface SmartValidationResult {
  overall: {
    status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    confidence: number; // 0-100%
    primaryIssues: string[];
    actionableAdvice: string[];
  };
  imageQuality: ImageAnalysisResult;
  documentType: DocumentClassification;
  contentAnalysis: {
    face?: FaceAnalysis;
    text?: TextExtraction;
    signature?: SignatureAnalysis;
  };
  contextualFeedback: {
    detectedDocument: string; // "Detected: Passport Photo"
    mainMessage: string; // "Face properly positioned with good lighting"
    specificIssues: string[]; // ["Background should be more uniform", "Signature quality is poor"]
    nextSteps: string[]; // ["Retake with plain white background", "Sign more clearly"]
  };
  compliance: {
    isCompliant: boolean;
    requirements: {
      name: string;
      status: 'met' | 'not_met' | 'needs_review';
      details: string;
    }[];
  };
}

export interface ValidationConfig {
  enableFaceDetection: boolean;
  enableTextExtraction: boolean;
  enableSignatureAnalysis: boolean;
  enableDocumentClassification: boolean;
  strictMode: boolean; // Higher quality thresholds
  expectedDocumentType?: string; // If user pre-selected document type
}

export class SmartValidationEngine {
  private imageAnalysis: ImageAnalysisService;
  private faceIntelligence: FaceIntelligence;
  private textIntelligence: TextIntelligence;
  private documentClassifier: DocumentClassifier;
  private signatureIntelligence: SignatureIntelligence;

  constructor() {
    this.imageAnalysis = new ImageAnalysisService();
    this.faceIntelligence = new FaceIntelligence();
    this.textIntelligence = new TextIntelligence();
    this.documentClassifier = new DocumentClassifier();
    this.signatureIntelligence = new SignatureIntelligence();
  }

  /**
   * Comprehensive document validation with AI-powered intelligence
   */
  async validateDocument(imageFile: File, config: ValidationConfig = this.getDefaultConfig()): Promise<SmartValidationResult> {
    try {
      // Phase 1: Basic image quality analysis
      const imageQuality = await this.imageAnalysis.analyzeImage(imageFile);
      
      // Phase 2: Document type classification
      const documentType = config.enableDocumentClassification 
        ? await this.documentClassifier.classifyDocument(imageFile)
        : this.createEmptyDocumentClassification();

      // Phase 3: Content analysis based on document type and configuration
      const contentAnalysis = await this.performContentAnalysis(imageFile, documentType, config);
      
      // Phase 4: Generate contextual feedback
      const contextualFeedback = this.generateContextualFeedback(imageQuality, documentType, contentAnalysis);
      
      // Phase 5: Compliance checking
      const compliance = this.checkCompliance(imageQuality, documentType, contentAnalysis, config);
      
      // Phase 6: Overall assessment
      const overall = this.calculateOverallAssessment(imageQuality, documentType, contentAnalysis, compliance);

      return {
        overall,
        imageQuality,
        documentType,
        contentAnalysis,
        contextualFeedback,
        compliance
      };
    } catch (error) {
      console.error('Smart validation error:', error);
      return this.createErrorResult(error);
    }
  }

  /**
   * Perform content analysis based on document type
   */
  private async performContentAnalysis(
    imageFile: File, 
    documentType: DocumentClassification, 
    config: ValidationConfig
  ): Promise<SmartValidationResult['contentAnalysis']> {
    const analysis: SmartValidationResult['contentAnalysis'] = {};

    // Face analysis for documents that typically contain faces
    if (config.enableFaceDetection && this.shouldAnalyzeFace(documentType)) {
      try {
        analysis.face = await this.faceIntelligence.analyzeFace(imageFile);
      } catch (error) {
        console.warn('Face analysis failed:', error);
      }
    }

    // Text analysis for documents with text content
    if (config.enableTextExtraction && this.shouldAnalyzeText(documentType)) {
      try {
        analysis.text = await this.textIntelligence.extractText(imageFile);
      } catch (error) {
        console.warn('Text analysis failed:', error);
      }
    }

    // Signature analysis for documents with signatures
    if (config.enableSignatureAnalysis && this.shouldAnalyzeSignature(documentType)) {
      try {
        analysis.signature = await this.signatureIntelligence.analyzeSignature(imageFile);
      } catch (error) {
        console.warn('Signature analysis failed:', error);
      }
    }

    return analysis;
  }

  /**
   * Generate contextual feedback based on all analysis results
   */
  private generateContextualFeedback(
    imageQuality: ImageAnalysisResult,
    documentType: DocumentClassification,
    contentAnalysis: SmartValidationResult['contentAnalysis']
  ): SmartValidationResult['contextualFeedback'] {
    
    // Primary document detection message
    const detectedDocument = `Detected: ${this.getDocumentDisplayName(documentType.detectedType)} (${documentType.confidence}% confidence)`;
    
    // Main message based on primary findings
    let mainMessage = '';
    const specificIssues: string[] = [];
    const nextSteps: string[] = [];

    // Analyze main content
    if (documentType.detectedType === 'passport_photo') {
      mainMessage = this.generatePassportPhotoFeedback(imageQuality, contentAnalysis.face, specificIssues, nextSteps);
    } else if (documentType.detectedType === 'signature') {
      mainMessage = this.generateSignatureFeedback(imageQuality, contentAnalysis.signature, specificIssues, nextSteps);
    } else if (documentType.detectedType === 'id_card' || documentType.detectedType === 'certificate') {
      mainMessage = this.generateDocumentFeedback(imageQuality, contentAnalysis, specificIssues, nextSteps);
    } else {
      mainMessage = this.generateGeneralFeedback(imageQuality, contentAnalysis, specificIssues, nextSteps);
    }

    // Add document-specific issues
    documentType.missingFeatures.forEach(missing => {
      if (missing === 'single_face') {
        specificIssues.push('Face detection needs improvement');
        nextSteps.push('Ensure one person is clearly visible');
      } else if (missing === 'white_background') {
        specificIssues.push('Background should be more uniform');
        nextSteps.push('Use a plain white or light colored background');
      }
    });

    return {
      detectedDocument,
      mainMessage,
      specificIssues,
      nextSteps
    };
  }

  /**
   * Generate passport photo specific feedback
   */
  private generatePassportPhotoFeedback(
    imageQuality: ImageAnalysisResult,
    faceAnalysis?: FaceAnalysis,
    specificIssues: string[] = [],
    nextSteps: string[] = []
  ): string {
    
    if (faceAnalysis && faceAnalysis.faceCount > 0 && faceAnalysis.primaryFace) {
      if (faceAnalysis.primaryFace.qualityScore > 8 && faceAnalysis.complianceCheck.passportPhotoCompliant) {
        return 'Face properly positioned with good passport compliance';
      } else if (faceAnalysis.complianceCheck.issues.length > 0) {
        faceAnalysis.complianceCheck.issues.forEach((flag: string) => specificIssues.push(flag));
        return 'Face detected but has compliance issues';
      } else {
        return 'Face detected with moderate quality';
      }
    } else {
      specificIssues.push('No clear face detected');
      nextSteps.push('Ensure face is clearly visible and well-lit');
      return 'Unable to detect face in passport photo';
    }
  }

  /**
   * Generate signature specific feedback
   */
  private generateSignatureFeedback(
    imageQuality: ImageAnalysisResult,
    signatureAnalysis?: SignatureAnalysis,
    specificIssues: string[] = [],
    nextSteps: string[] = []
  ): string {
    
    if (signatureAnalysis?.isDetected) {
      if (signatureAnalysis.quality === 'excellent') {
        return 'High-quality signature with excellent characteristics';
      } else if (signatureAnalysis.quality === 'good') {
        return 'Good signature quality detected';
      } else {
        signatureAnalysis.validation.redFlags.forEach(flag => specificIssues.push(flag));
        signatureAnalysis.validation.recommendations.forEach(rec => nextSteps.push(rec));
        return 'Signature detected but quality needs improvement';
      }
    } else {
      specificIssues.push('No signature detected');
      nextSteps.push('Ensure signature is clearly visible with good contrast');
      return 'Unable to detect signature';
    }
  }

  /**
   * Generate document feedback for ID cards, certificates, etc.
   */
  private generateDocumentFeedback(
    imageQuality: ImageAnalysisResult,
    contentAnalysis: SmartValidationResult['contentAnalysis'],
    specificIssues: string[] = [],
    nextSteps: string[] = []
  ): string {
    
    const hasGoodText = contentAnalysis.text?.confidence && contentAnalysis.text.confidence > 70;
    const hasGoodFace = contentAnalysis.face?.primaryFace?.qualityScore && contentAnalysis.face.primaryFace.qualityScore > 7;
    
    if (hasGoodText && hasGoodFace) {
      return 'Document content is clearly readable with good photo quality';
    } else if (hasGoodText) {
      return 'Text content is clear but photo quality could be improved';
    } else if (hasGoodFace) {
      return 'Photo quality is good but text readability needs improvement';
    } else {
      specificIssues.push('Both text and photo quality need improvement');
      nextSteps.push('Improve lighting and focus for better clarity');
      return 'Document quality needs significant improvement';
    }
  }

  /**
   * Generate general feedback
   */
  private generateGeneralFeedback(
    imageQuality: ImageAnalysisResult,
    contentAnalysis: SmartValidationResult['contentAnalysis'],
    specificIssues: string[] = [],
    nextSteps: string[] = []
  ): string {
    
    if (imageQuality.overall.score > 8) {
      return 'Image quality is excellent';
    } else if (imageQuality.overall.score > 6) {
      return 'Image quality is good with minor issues';
    } else {
      imageQuality.recommendations.forEach((issue: string) => specificIssues.push(issue));
      return 'Image quality needs improvement';
    }
  }

  /**
   * Check compliance based on document type and analysis results
   */
  private checkCompliance(
    imageQuality: ImageAnalysisResult,
    documentType: DocumentClassification,
    contentAnalysis: SmartValidationResult['contentAnalysis'],
    config: ValidationConfig
  ): SmartValidationResult['compliance'] {
    
    const requirements: SmartValidationResult['compliance']['requirements'] = [];
    
    // Basic image quality requirements
    requirements.push({
      name: 'Image Quality',
      status: imageQuality.overall.score > (config.strictMode ? 8 : 6) ? 'met' : 'not_met',
      details: `Quality score: ${imageQuality.overall.score}/10`
    });

    // Document-specific requirements
    if (documentType.detectedType === 'passport_photo') {
      this.addPassportRequirements(requirements, contentAnalysis.face, config.strictMode);
    } else if (documentType.detectedType === 'signature') {
      this.addSignatureRequirements(requirements, contentAnalysis.signature, config.strictMode);
    } else if (documentType.detectedType === 'id_card' || documentType.detectedType === 'certificate') {
      this.addDocumentRequirements(requirements, contentAnalysis, config.strictMode);
    }

    // Overall compliance
    const metCount = requirements.filter(req => req.status === 'met').length;
    const isCompliant = metCount === requirements.length;

    return {
      isCompliant,
      requirements
    };
  }

  /**
   * Add passport photo specific requirements
   */
  private addPassportRequirements(
    requirements: SmartValidationResult['compliance']['requirements'],
    faceAnalysis?: FaceAnalysis,
    strictMode: boolean = false
  ): void {
    
    if (faceAnalysis) {
      requirements.push({
        name: 'Face Detection',
        status: faceAnalysis.faceCount > 0 && faceAnalysis.primaryFace && faceAnalysis.primaryFace.qualityScore > (strictMode ? 8 : 6) ? 'met' : 'not_met',
        details: `Face quality: ${faceAnalysis.primaryFace?.qualityScore || 0}/10`
      });

      requirements.push({
        name: 'Passport Compliance',
        status: faceAnalysis.complianceCheck.passportPhotoCompliant ? 'met' : 'not_met',
        details: faceAnalysis.complianceCheck.issues.length > 0 ? faceAnalysis.complianceCheck.issues.join(', ') : 'All checks passed'
      });

      requirements.push({
        name: 'Background Quality',
        status: faceAnalysis.backgroundAnalysis.uniform ? 'met' : 'not_met',
        details: `Background: ${faceAnalysis.backgroundAnalysis.uniform ? 'uniform' : 'not uniform'}`
      });
    } else {
      requirements.push({
        name: 'Face Detection',
        status: 'not_met',
        details: 'No face analysis available'
      });
    }
  }

  /**
   * Add signature specific requirements
   */
  private addSignatureRequirements(
    requirements: SmartValidationResult['compliance']['requirements'],
    signatureAnalysis?: SignatureAnalysis,
    strictMode: boolean = false
  ): void {
    
    if (signatureAnalysis) {
      requirements.push({
        name: 'Signature Detection',
        status: signatureAnalysis.isDetected && signatureAnalysis.confidence > (strictMode ? 80 : 60) ? 'met' : 'not_met',
        details: `Signature confidence: ${signatureAnalysis.confidence}%`
      });

      requirements.push({
        name: 'Signature Quality',
        status: ['excellent', 'good'].includes(signatureAnalysis.quality) ? 'met' : 'needs_review',
        details: `Quality: ${signatureAnalysis.quality}`
      });

      requirements.push({
        name: 'Authenticity Check',
        status: signatureAnalysis.validation.isAuthentic ? 'met' : 'needs_review',
        details: signatureAnalysis.validation.redFlags.length > 0 ? 
          `Concerns: ${signatureAnalysis.validation.redFlags.join(', ')}` : 'No authenticity concerns'
      });
    } else {
      requirements.push({
        name: 'Signature Detection',
        status: 'not_met',
        details: 'No signature analysis available'
      });
    }
  }

  /**
   * Add general document requirements
   */
  private addDocumentRequirements(
    requirements: SmartValidationResult['compliance']['requirements'],
    contentAnalysis: SmartValidationResult['contentAnalysis'],
    strictMode: boolean = false
  ): void {
    
    if (contentAnalysis.text) {
      requirements.push({
        name: 'Text Readability',
        status: contentAnalysis.text.confidence > (strictMode ? 80 : 60) ? 'met' : 'not_met',
        details: `Text confidence: ${contentAnalysis.text.confidence}%`
      });
    }

    if (contentAnalysis.face) {
      requirements.push({
        name: 'Photo Quality',
        status: contentAnalysis.face.primaryFace && contentAnalysis.face.primaryFace.qualityScore > (strictMode ? 7 : 5) ? 'met' : 'not_met',
        details: `Photo quality: ${contentAnalysis.face.primaryFace?.qualityScore || 0}/10`
      });
    }
  }

  /**
   * Calculate overall assessment
   */
  private calculateOverallAssessment(
    imageQuality: ImageAnalysisResult,
    documentType: DocumentClassification,
    contentAnalysis: SmartValidationResult['contentAnalysis'],
    compliance: SmartValidationResult['compliance']
  ): SmartValidationResult['overall'] {
    
    // Base score from image quality (convert 0-10 to 0-100 scale)
    let score = imageQuality.overall.score * 10;
    
    // Adjust based on document classification confidence
    if (documentType.confidence > 80) {
      score += 5;
    } else if (documentType.confidence < 50) {
      score -= 10;
    }

    // Adjust based on content analysis
    if (contentAnalysis.face?.primaryFace?.qualityScore && contentAnalysis.face.primaryFace.qualityScore > 8) score += 5;
    if (contentAnalysis.text?.confidence && contentAnalysis.text.confidence > 80) score += 5;
    if (contentAnalysis.signature?.quality === 'excellent') score += 5;

    // Adjust based on compliance
    const complianceRate = compliance.requirements.filter(req => req.status === 'met').length / compliance.requirements.length;
    if (complianceRate === 1) {
      score += 10;
    } else if (complianceRate < 0.5) {
      score -= 15;
    }

    // Determine status
    let status: SmartValidationResult['overall']['status'];
    if (score >= 85) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'needs_improvement';
    else status = 'poor';

    // Generate primary issues
    const primaryIssues: string[] = [];
    const actionableAdvice: string[] = [];

    if (!compliance.isCompliant) {
      compliance.requirements.filter(req => req.status === 'not_met').forEach(req => {
        primaryIssues.push(req.name);
        actionableAdvice.push(req.details);
      });
    }

    if (imageQuality.overall.score < 7) {
      primaryIssues.push('Image quality');
      actionableAdvice.push(...imageQuality.recommendations);
    }

    documentType.suggestions.forEach(suggestion => actionableAdvice.push(suggestion));

    return {
      status,
      confidence: Math.round(Math.max(0, Math.min(100, score))),
      primaryIssues,
      actionableAdvice: [...new Set(actionableAdvice)] // Remove duplicates
    };
  }

  // Helper methods
  private shouldAnalyzeFace(documentType: DocumentClassification): boolean {
    return ['passport_photo', 'id_card'].includes(documentType.detectedType) || documentType.metadata.hasFace;
  }

  private shouldAnalyzeText(documentType: DocumentClassification): boolean {
    return ['id_card', 'certificate', 'document'].includes(documentType.detectedType) || documentType.metadata.hasText;
  }

  private shouldAnalyzeSignature(documentType: DocumentClassification): boolean {
    return ['signature', 'certificate', 'document'].includes(documentType.detectedType) || documentType.metadata.hasSignature;
  }

  private getDocumentDisplayName(type: string): string {
    const displayNames: { [key: string]: string } = {
      'passport_photo': 'Passport Photo',
      'signature': 'Signature',
      'id_card': 'ID Card',
      'certificate': 'Certificate',
      'document': 'Document',
      'other': 'Unknown Document'
    };
    return displayNames[type] || 'Unknown Document';
  }

  private getDefaultConfig(): ValidationConfig {
    return {
      enableFaceDetection: true,
      enableTextExtraction: true,
      enableSignatureAnalysis: true,
      enableDocumentClassification: true,
      strictMode: false
    };
  }

  private createEmptyDocumentClassification(): DocumentClassification {
    return {
      detectedType: 'other',
      confidence: 0,
      expectedFeatures: [],
      missingFeatures: [],
      suggestions: [],
      alternativeTypes: [],
      metadata: {
        aspectRatio: 1,
        dominantColors: [],
        hasText: false,
        hasFace: false,
        hasSignature: false,
        complexity: 'simple'
      }
    };
  }

  private createErrorResult(error: any): SmartValidationResult {
    return {
      overall: {
        status: 'poor',
        confidence: 0,
        primaryIssues: ['Analysis failed'],
        actionableAdvice: ['Please try again with a clearer image']
      },
      imageQuality: {
        overall: {
          score: 0,
          status: 'unusable',
          canProceed: false,
          confidence: 0
        },
        blur: {
          score: 0,
          isBlurry: true,
          severity: 'severe',
          message: 'Analysis failed'
        },
        brightness: {
          score: 0,
          level: 'too-dark',
          isUsable: false,
          message: 'Analysis failed'
        },
        contrast: {
          score: 0,
          level: 'very-low',
          isUsable: false,
          message: 'Analysis failed'
        },
        orientation: {
          rotation: 0,
          isUpsideDown: false,
          needsRotation: false,
          suggestedRotation: 0,
          message: 'Analysis failed'
        },
        fileHealth: {
          isCorrupted: true,
          isComplete: false,
          format: 'unknown',
          isSupported: false,
          message: 'Analysis failed'
        },
        recommendations: ['Please try uploading the image again'],
        processingTime: 0
      },
      documentType: this.createEmptyDocumentClassification(),
      contentAnalysis: {},
      contextualFeedback: {
        detectedDocument: 'Analysis Failed',
        mainMessage: 'Unable to analyze document',
        specificIssues: ['Processing error occurred'],
        nextSteps: ['Please try again with a different image']
      },
      compliance: {
        isCompliant: false,
        requirements: [{
          name: 'Analysis',
          status: 'not_met',
          details: 'Processing failed'
        }]
      }
    };
  }
}