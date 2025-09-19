/**
 * Phase 2: Document Classification System
 * AI-powered document type detection with feature analysis
 */

'use client';

import { ColorThief } from 'color-thief-browser';

export interface DocumentClassification {
  detectedType: 'passport_photo' | 'signature' | 'id_card' | 'certificate' | 'document' | 'other';
  confidence: number; // 0-100%
  expectedFeatures: string[]; // ["single_face", "white_background", "portrait_orientation"]
  missingFeatures: string[]; // ["uniform_background", "proper_lighting"]
  suggestions: string[]; // ["Use plain white background", "Ensure face is clearly visible"]
  alternativeTypes: { type: string; confidence: number }[]; // Other possible document types
  metadata: {
    aspectRatio: number;
    dominantColors: string[];
    hasText: boolean;
    hasFace: boolean;
    hasSignature: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

export interface DocumentFeatures {
  visual: {
    aspectRatio: number;
    orientation: 'portrait' | 'landscape' | 'square';
    dominantColors: string[];
    backgroundUniformity: number; // 0-100
    edgeDensity: number; // Amount of edges/details
    symmetry: number; // 0-100
  };
  content: {
    hasText: boolean;
    textDensity: number; // 0-100
    hasFace: boolean;
    faceCount: number;
    hasSignature: boolean;
    hasOfficialElements: boolean; // Seals, stamps, logos
    hasPhotograph: boolean;
  };
  structure: {
    hasHeaders: boolean;
    hasColumns: boolean;
    hasTables: boolean;
    hasBorders: boolean;
    hasSections: boolean;
  };
}

interface DocumentTypeSignature {
  type: string;
  displayName: string;
  expectedFeatures: string[];
  visualCriteria: {
    aspectRatio: { min: number; max: number };
    orientation: 'portrait' | 'landscape' | 'any';
    backgroundColor: 'white' | 'light' | 'any';
    complexity: 'simple' | 'moderate' | 'complex' | 'any';
  };
  contentCriteria: {
    requiresFace: boolean;
    requiresText: boolean;
    requiresSignature: boolean;
    maxFaces: number;
    textDensity: { min: number; max: number };
  };
  confidence: {
    base: number;
    faceBonus: number;
    textBonus: number;
    aspectRatioBonus: number;
  };
}

export class DocumentClassifier {
  private documentTypes: DocumentTypeSignature[] = [
    {
      type: 'passport_photo',
      displayName: 'Passport Photo',
      expectedFeatures: ['single_face', 'white_background', 'portrait_orientation', 'head_shoulders_visible'],
      visualCriteria: {
        aspectRatio: { min: 0.8, max: 1.2 }, // Nearly square
        orientation: 'portrait',
        backgroundColor: 'white',
        complexity: 'simple'
      },
      contentCriteria: {
        requiresFace: true,
        requiresText: false,
        requiresSignature: false,
        maxFaces: 1,
        textDensity: { min: 0, max: 10 }
      },
      confidence: {
        base: 20,
        faceBonus: 40,
        textBonus: -20, // Penalty for text in passport photos
        aspectRatioBonus: 20
      }
    },
    {
      type: 'signature',
      displayName: 'Signature',
      expectedFeatures: ['handwritten_marks', 'clear_background', 'continuous_strokes'],
      visualCriteria: {
        aspectRatio: { min: 2.0, max: 6.0 }, // Wide signature
        orientation: 'landscape',
        backgroundColor: 'white',
        complexity: 'simple'
      },
      contentCriteria: {
        requiresFace: false,
        requiresText: false,
        requiresSignature: true,
        maxFaces: 0,
        textDensity: { min: 0, max: 30 }
      },
      confidence: {
        base: 15,
        faceBonus: -30, // Penalty for faces in signatures
        textBonus: -10,
        aspectRatioBonus: 30
      }
    },
    {
      type: 'id_card',
      displayName: 'ID Card/Document',
      expectedFeatures: ['photo_section', 'text_fields', 'official_format', 'structured_layout'],
      visualCriteria: {
        aspectRatio: { min: 1.2, max: 2.0 }, // Credit card like
        orientation: 'landscape',
        backgroundColor: 'any',
        complexity: 'moderate'
      },
      contentCriteria: {
        requiresFace: true,
        requiresText: true,
        requiresSignature: false,
        maxFaces: 1,
        textDensity: { min: 20, max: 80 }
      },
      confidence: {
        base: 25,
        faceBonus: 25,
        textBonus: 25,
        aspectRatioBonus: 15
      }
    },
    {
      type: 'certificate',
      displayName: 'Certificate/Document',
      expectedFeatures: ['title_header', 'body_text', 'official_elements', 'signature_area'],
      visualCriteria: {
        aspectRatio: { min: 1.2, max: 1.6 }, // A4-like
        orientation: 'portrait',
        backgroundColor: 'white',
        complexity: 'moderate'
      },
      contentCriteria: {
        requiresFace: false,
        requiresText: true,
        requiresSignature: true,
        maxFaces: 0,
        textDensity: { min: 30, max: 90 }
      },
      confidence: {
        base: 20,
        faceBonus: -10, // Small penalty for faces
        textBonus: 30,
        aspectRatioBonus: 20
      }
    },
    {
      type: 'document',
      displayName: 'General Document',
      expectedFeatures: ['text_content', 'structured_format'],
      visualCriteria: {
        aspectRatio: { min: 1.0, max: 2.0 },
        orientation: 'any',
        backgroundColor: 'any',
        complexity: 'any'
      },
      contentCriteria: {
        requiresFace: false,
        requiresText: true,
        requiresSignature: false,
        maxFaces: 5,
        textDensity: { min: 20, max: 100 }
      },
      confidence: {
        base: 30,
        faceBonus: 0,
        textBonus: 20,
        aspectRatioBonus: 10
      }
    }
  ];

  /**
   * Classify document type based on visual and content analysis
   */
  async classifyDocument(imageFile: File): Promise<DocumentClassification> {
    // Extract features from the image
    const features = await this.extractDocumentFeatures(imageFile);
    
    // Calculate confidence scores for each document type
    const typeScores = this.documentTypes.map(docType => ({
      type: docType.type,
      displayName: docType.displayName,
      confidence: this.calculateTypeConfidence(features, docType),
      docType
    }));

    // Sort by confidence
    typeScores.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = typeScores[0];
    const alternativeTypes = typeScores.slice(1, 4).map(score => ({
      type: score.displayName,
      confidence: Math.round(score.confidence)
    }));

    // Generate expected and missing features
    const expectedFeatures = bestMatch.docType.expectedFeatures;
    const missingFeatures = this.identifyMissingFeatures(features, bestMatch.docType);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(features, bestMatch.docType, missingFeatures);

    return {
      detectedType: bestMatch.type as DocumentClassification['detectedType'],
      confidence: Math.round(bestMatch.confidence),
      expectedFeatures,
      missingFeatures,
      suggestions,
      alternativeTypes,
      metadata: {
        aspectRatio: features.visual.aspectRatio,
        dominantColors: features.visual.dominantColors,
        hasText: features.content.hasText,
        hasFace: features.content.hasFace,
        hasSignature: features.content.hasSignature,
        complexity: features.visual.edgeDensity > 70 ? 'complex' : 
                   features.visual.edgeDensity > 30 ? 'moderate' : 'simple'
      }
    };
  }

  /**
   * Extract comprehensive features from document image
   */
  private async extractDocumentFeatures(imageFile: File): Promise<DocumentFeatures> {
    const img = await this.loadImage(imageFile);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Extract visual features
    const visual = await this.extractVisualFeatures(imageData, img);
    
    // Extract content features
    const content = await this.extractContentFeatures(imageData);
    
    // Extract structural features
    const structure = this.extractStructuralFeatures(imageData);

    // Cleanup
    URL.revokeObjectURL(img.src);

    return { visual, content, structure };
  }

  /**
   * Extract visual characteristics
   */
  private async extractVisualFeatures(imageData: ImageData, img: HTMLImageElement): Promise<DocumentFeatures['visual']> {
    const { width, height, data } = imageData;
    const aspectRatio = width / height;
    const orientation = aspectRatio > 1.1 ? 'landscape' : aspectRatio < 0.9 ? 'portrait' : 'square';

    // Extract dominant colors using ColorThief
    let dominantColors: string[] = [];
    try {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 5);
      dominantColors = palette.map(color => 
        `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`
      );
    } catch (error) {
      // Fallback color extraction
      dominantColors = this.extractColorsBasic(imageData);
    }

    // Calculate background uniformity
    const backgroundUniformity = this.calculateBackgroundUniformity(imageData);
    
    // Calculate edge density
    const edgeDensity = this.calculateEdgeDensity(imageData);
    
    // Calculate symmetry
    const symmetry = this.calculateSymmetry(imageData);

    return {
      aspectRatio: Math.round(aspectRatio * 100) / 100,
      orientation,
      dominantColors,
      backgroundUniformity: Math.round(backgroundUniformity),
      edgeDensity: Math.round(edgeDensity),
      symmetry: Math.round(symmetry)
    };
  }

  /**
   * Extract content-related features
   */
  private async extractContentFeatures(imageData: ImageData): Promise<DocumentFeatures['content']> {
    // Basic content analysis - would be enhanced with actual ML models
    const { width, height, data } = imageData;
    
    // Text detection (basic)
    const hasText = this.detectTextPresence(imageData);
    const textDensity = hasText ? this.calculateTextDensity(imageData) : 0;
    
    // Face detection (basic)
    const faceDetection = this.basicFaceDetection(imageData);
    
    // Signature detection (basic)
    const hasSignature = this.detectSignature(imageData);
    
    // Official elements detection
    const hasOfficialElements = this.detectOfficialElements(imageData);
    
    // Photograph detection
    const hasPhotograph = faceDetection.hasFace || this.detectPhotographicContent(imageData);

    return {
      hasText,
      textDensity: Math.round(textDensity),
      hasFace: faceDetection.hasFace,
      faceCount: faceDetection.faceCount,
      hasSignature,
      hasOfficialElements,
      hasPhotograph
    };
  }

  /**
   * Extract structural features
   */
  private extractStructuralFeatures(imageData: ImageData): DocumentFeatures['structure'] {
    // Basic structural analysis
    const hasHeaders = this.detectHeaders(imageData);
    const hasColumns = this.detectColumns(imageData);
    const hasTables = this.detectTables(imageData);
    const hasBorders = this.detectBorders(imageData);
    const hasSections = this.detectSections(imageData);

    return {
      hasHeaders,
      hasColumns,
      hasTables,
      hasBorders,
      hasSections
    };
  }

  /**
   * Calculate confidence score for a document type
   */
  private calculateTypeConfidence(features: DocumentFeatures, docType: DocumentTypeSignature): number {
    let confidence = docType.confidence.base;

    // Visual criteria matching
    const aspectRatioMatch = features.visual.aspectRatio >= docType.visualCriteria.aspectRatio.min &&
                           features.visual.aspectRatio <= docType.visualCriteria.aspectRatio.max;
    if (aspectRatioMatch) {
      confidence += docType.confidence.aspectRatioBonus;
    }

    const orientationMatch = docType.visualCriteria.orientation === 'any' || 
                           features.visual.orientation === docType.visualCriteria.orientation;
    if (orientationMatch) {
      confidence += 10;
    }

    // Content criteria matching
    if (docType.contentCriteria.requiresFace && features.content.hasFace) {
      confidence += docType.confidence.faceBonus;
    } else if (docType.contentCriteria.requiresFace && !features.content.hasFace) {
      confidence -= 20;
    } else if (!docType.contentCriteria.requiresFace && features.content.hasFace) {
      confidence += docType.confidence.faceBonus;
    }

    if (docType.contentCriteria.requiresText && features.content.hasText) {
      confidence += docType.confidence.textBonus;
    } else if (docType.contentCriteria.requiresText && !features.content.hasText) {
      confidence -= 15;
    }

    if (docType.contentCriteria.requiresSignature && features.content.hasSignature) {
      confidence += 15;
    }

    // Face count validation
    if (features.content.faceCount > docType.contentCriteria.maxFaces) {
      confidence -= 20;
    }

    // Text density validation
    const textDensityInRange = features.content.textDensity >= docType.contentCriteria.textDensity.min &&
                              features.content.textDensity <= docType.contentCriteria.textDensity.max;
    if (textDensityInRange) {
      confidence += 15;
    } else {
      confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Identify missing features for a document type
   */
  private identifyMissingFeatures(features: DocumentFeatures, docType: DocumentTypeSignature): string[] {
    const missing: string[] = [];

    docType.expectedFeatures.forEach(expectedFeature => {
      switch (expectedFeature) {
        case 'single_face':
          if (!features.content.hasFace || features.content.faceCount !== 1) {
            missing.push('single_face');
          }
          break;
        case 'white_background':
          if (features.visual.backgroundUniformity < 70 || 
              !features.visual.dominantColors.some(color => this.isNearWhite(color))) {
            missing.push('white_background');
          }
          break;
        case 'handwritten_marks':
          if (!features.content.hasSignature) {
            missing.push('handwritten_marks');
          }
          break;
        case 'text_content':
          if (!features.content.hasText) {
            missing.push('text_content');
          }
          break;
        case 'official_elements':
          if (!features.content.hasOfficialElements) {
            missing.push('official_elements');
          }
          break;
      }
    });

    return missing;
  }

  /**
   * Generate actionable suggestions
   */
  private generateSuggestions(features: DocumentFeatures, docType: DocumentTypeSignature, missingFeatures: string[]): string[] {
    const suggestions: string[] = [];

    missingFeatures.forEach(missing => {
      switch (missing) {
        case 'single_face':
          if (!features.content.hasFace) {
            suggestions.push('Ensure a clear face is visible in the photo');
          } else if (features.content.faceCount > 1) {
            suggestions.push('Only one person should be visible in the photo');
          }
          break;
        case 'white_background':
          suggestions.push('Use a plain white or very light colored background');
          break;
        case 'handwritten_marks':
          suggestions.push('Ensure signature or handwritten elements are clearly visible');
          break;
        case 'text_content':
          suggestions.push('Make sure all text is clearly visible and readable');
          break;
        case 'official_elements':
          suggestions.push('Include any official seals, stamps, or logos');
          break;
      }
    });

    // Type-specific suggestions
    if (docType.type === 'passport_photo') {
      if (features.visual.aspectRatio < 0.8 || features.visual.aspectRatio > 1.2) {
        suggestions.push('Photo should be square or nearly square format');
      }
    }

    if (docType.type === 'signature') {
      if (features.visual.aspectRatio < 2.0) {
        suggestions.push('Signature should be in landscape orientation');
      }
    }

    return suggestions;
  }

  // Feature detection helper methods
  private detectTextPresence(imageData: ImageData): boolean {
    // Basic text detection using edge patterns
    const edgeCount = this.calculateEdgeCount(imageData);
    return edgeCount > 100; // Threshold for text presence
  }

  private calculateTextDensity(imageData: ImageData): number {
    const edgeCount = this.calculateEdgeCount(imageData);
    const totalPixels = imageData.width * imageData.height;
    return (edgeCount / totalPixels) * 100;
  }

  private basicFaceDetection(imageData: ImageData): { hasFace: boolean; faceCount: number } {
    // Basic face detection using skin tone analysis
    const skinPixels = this.detectSkinTones(imageData);
    const hasFace = skinPixels > 0.05; // 5% skin tone pixels
    return {
      hasFace,
      faceCount: hasFace ? 1 : 0 // Simplified - would need proper face detection
    };
  }

  private detectSignature(imageData: ImageData): boolean {
    // Basic signature detection - look for continuous strokes
    return this.detectContinuousStrokes(imageData);
  }

  private detectOfficialElements(imageData: ImageData): boolean {
    // Look for circular patterns (stamps), geometric shapes (seals)
    return this.detectCircularPatterns(imageData) || this.detectGeometricShapes(imageData);
  }

  private detectPhotographicContent(imageData: ImageData): boolean {
    // Check for photographic characteristics (gradients, natural colors)
    return this.calculateColorGradients(imageData) > 30;
  }

  // Low-level image analysis methods
  private calculateBackgroundUniformity(imageData: ImageData): number {
    const { data, width, height } = imageData;
    const edgePixels = [];
    
    // Sample edge pixels
    for (let x = 0; x < width; x += 10) {
      edgePixels.push(data[x * 4], data[x * 4 + 1], data[x * 4 + 2]); // Top edge
      const bottomIdx = ((height - 1) * width + x) * 4;
      edgePixels.push(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]); // Bottom edge
    }

    // Calculate variance
    const mean = edgePixels.reduce((sum, val) => sum + val, 0) / edgePixels.length;
    const variance = edgePixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / edgePixels.length;
    
    return Math.max(0, 100 - (variance / 10)); // Convert to uniformity percentage
  }

  private calculateEdgeDensity(imageData: ImageData): number {
    return (this.calculateEdgeCount(imageData) / (imageData.width * imageData.height)) * 100;
  }

  private calculateSymmetry(imageData: ImageData): number {
    const { data, width, height } = imageData;
    let matchingPixels = 0;
    let totalChecked = 0;

    // Check vertical symmetry
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width / 2; x += 5) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        
        const leftColor = data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2];
        const rightColor = data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2];
        
        if (Math.abs(leftColor - rightColor) < 50) {
          matchingPixels++;
        }
        totalChecked++;
      }
    }

    return totalChecked > 0 ? (matchingPixels / totalChecked) * 100 : 0;
  }

  private calculateEdgeCount(imageData: ImageData): number {
    const { data, width, height } = imageData;
    let edgeCount = 0;

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const current = data[idx] + data[idx + 1] + data[idx + 2];
        const right = data[idx + 4] + data[idx + 5] + data[idx + 6];
        const bottom = data[((y + 1) * width + x) * 4] + 
                      data[((y + 1) * width + x) * 4 + 1] + 
                      data[((y + 1) * width + x) * 4 + 2];

        if (Math.abs(current - right) > 100 || Math.abs(current - bottom) > 100) {
          edgeCount++;
        }
      }
    }

    return edgeCount;
  }

  private detectSkinTones(imageData: ImageData): number {
    const { data } = imageData;
    let skinPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (this.isSkinTone(r, g, b)) {
        skinPixels++;
      }
      totalPixels++;
    }

    return skinPixels / totalPixels;
  }

  private detectContinuousStrokes(imageData: ImageData): boolean {
    // Simplified stroke detection - look for connected dark pixels
    const { data, width, height } = imageData;
    let connectedRegions = 0;

    // Sample for continuous dark lines
    for (let y = height / 4; y < (3 * height) / 4; y += 10) {
      let consecutiveDark = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (brightness < 100) {
          consecutiveDark++;
        } else {
          if (consecutiveDark > 20) {
            connectedRegions++;
          }
          consecutiveDark = 0;
        }
      }
    }

    return connectedRegions > 2;
  }

  private detectCircularPatterns(imageData: ImageData): boolean {
    // Basic circular pattern detection - simplified
    return false; // Would need proper shape detection algorithms
  }

  private detectGeometricShapes(imageData: ImageData): boolean {
    // Basic geometric shape detection - simplified
    return false; // Would need proper shape detection algorithms
  }

  private calculateColorGradients(imageData: ImageData): number {
    const { data } = imageData;
    let gradientStrength = 0;
    let samples = 0;

    for (let i = 0; i < data.length; i += 400) { // Sample every 100th pixel
      if (i + 12 < data.length) {
        const r1 = data[i], g1 = data[i + 1], b1 = data[i + 2];
        const r2 = data[i + 12], g2 = data[i + 13], b2 = data[i + 14];
        
        const gradient = Math.sqrt(
          Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
        );
        gradientStrength += gradient;
        samples++;
      }
    }

    return samples > 0 ? gradientStrength / samples : 0;
  }

  private extractColorsBasic(imageData: ImageData): string[] {
    // Basic color extraction fallback
    const { data } = imageData;
    const colorCounts: { [key: string]: number } = {};

    for (let i = 0; i < data.length; i += 40) {
      const r = Math.round(data[i] / 50) * 50;
      const g = Math.round(data[i + 1] / 50) * 50;
      const b = Math.round(data[i + 2] / 50) * 50;
      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }

    return Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);
  }

  // Structural detection methods (simplified)
  private detectHeaders(imageData: ImageData): boolean { return false; }
  private detectColumns(imageData: ImageData): boolean { return false; }
  private detectTables(imageData: ImageData): boolean { return false; }
  private detectBorders(imageData: ImageData): boolean { return false; }
  private detectSections(imageData: ImageData): boolean { return false; }

  // Helper methods
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    return r > 95 && g > 40 && b > 20 && 
           Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
           Math.abs(r - g) > 15 && r > g && r > b;
  }

  private isNearWhite(color: string): boolean {
    const rgb = this.hexToRgb(color);
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 240;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}