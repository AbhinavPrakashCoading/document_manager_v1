/**
 * Phase 2: Text Intelligence Engine
 * OCR integration with text extraction, readability analysis, and field detection
 */

'use client';

import Tesseract, { Worker } from 'tesseract.js';
import * as natural from 'natural';

export interface TextRegion {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  type: 'printed' | 'handwritten' | 'mixed';
  language: string;
}

export interface TextExtraction {
  extractedText: string;
  readabilityScore: number; // 0-10
  confidence: number; // 0-100
  textRegions: TextRegion[];
  requiredFields: {
    found: { [key: string]: string }; // {"name": "John Doe", "date": "1990-01-01"}
    missing: string[]; // ["registration_number", "signature"]
    partial: { [key: string]: string }; // Fields found but possibly incomplete
  };
  textQuality: {
    clear: boolean;
    completelyVisible: boolean;
    handwrittenReadable: boolean;
    printedReadable: boolean;
    averageConfidence: number;
  };
  languageDetection: {
    primary: string;
    confidence: number;
    mixed: boolean;
  };
}

export interface TextValidation {
  isValid: boolean;
  overallScore: number; // 0-10
  fieldValidation: {
    [fieldName: string]: {
      found: boolean;
      value: string;
      confidence: number;
      format: 'valid' | 'invalid' | 'questionable';
      suggestions: string[];
    };
  };
  recommendations: string[];
}

export interface RequiredField {
  name: string;
  displayName: string;
  patterns: RegExp[];
  required: boolean;
  format?: 'date' | 'number' | 'text' | 'email' | 'phone';
  examples?: string[];
  aliases?: string[];
}

export class TextIntelligence {
  private worker: Worker | null = null;
  private isInitialized = false;

  /**
   * Initialize OCR worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await Tesseract.createWorker('eng+hin', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/() ',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      this.isInitialized = true;
      console.log('Text Intelligence initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      // Continue without OCR for basic analysis
      this.isInitialized = true;
    }
  }

  /**
   * Extract text from image with comprehensive analysis
   */
  async extractText(imageFile: File, requiredFields: RequiredField[] = []): Promise<TextExtraction> {
    await this.initialize();

    let extractedText = '';
    let confidence = 0;
    let textRegions: TextRegion[] = [];

    try {
      if (this.worker) {
        // Perform OCR
        const result = await this.worker.recognize(imageFile);
        extractedText = result.data.text;
        confidence = result.data.confidence;

        // Extract text regions with bounding boxes
        textRegions = result.data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
          type: this.detectTextType(word.text),
          language: 'en' // Could be enhanced with language detection
        }));
      } else {
        // Fallback: basic text analysis without OCR
        extractedText = 'OCR not available - please ensure text is clearly visible';
        confidence = 50;
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      extractedText = 'Text extraction failed - please ensure image is clear and well-lit';
      confidence = 0;
    }

    // Analyze text quality
    const textQuality = this.analyzeTextQuality(textRegions, extractedText);
    
    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(extractedText, textQuality);
    
    // Extract required fields
    const requiredFieldsResult = this.extractRequiredFields(extractedText, requiredFields);
    
    // Detect language
    const languageDetection = this.detectLanguage(extractedText);

    return {
      extractedText,
      readabilityScore,
      confidence,
      textRegions,
      requiredFields: requiredFieldsResult,
      textQuality,
      languageDetection
    };
  }

  /**
   * Validate document text against requirements
   */
  async validateDocumentText(
    extraction: TextExtraction,
    requiredFields: RequiredField[]
  ): Promise<TextValidation> {
    const fieldValidation: TextValidation['fieldValidation'] = {};
    let overallScore = 10;
    const recommendations: string[] = [];

    // Validate each required field
    requiredFields.forEach(field => {
      const fieldResult = this.validateField(extraction, field);
      fieldValidation[field.name] = fieldResult;

      if (!fieldResult.found && field.required) {
        overallScore -= 2;
        recommendations.push(`Missing required field: ${field.displayName}`);
      } else if (fieldResult.format === 'invalid') {
        overallScore -= 1;
        recommendations.push(`Invalid format for ${field.displayName}: ${fieldResult.suggestions.join(', ')}`);
      } else if (fieldResult.confidence < 70) {
        overallScore -= 0.5;
        recommendations.push(`Low confidence for ${field.displayName} - ensure text is clear`);
      }
    });

    // Text quality penalties
    if (extraction.textQuality.averageConfidence < 60) {
      overallScore -= 2;
      recommendations.push('Text quality is poor - use better lighting and focus');
    }

    if (!extraction.textQuality.completelyVisible) {
      overallScore -= 1;
      recommendations.push('Some text appears cut off - ensure entire document is visible');
    }

    if (!extraction.textQuality.handwrittenReadable && extraction.textRegions.some(r => r.type === 'handwritten')) {
      overallScore -= 1;
      recommendations.push('Handwritten text is difficult to read - write more clearly');
    }

    overallScore = Math.max(0, Math.min(10, overallScore));

    return {
      isValid: overallScore >= 6 && extraction.requiredFields.missing.length === 0,
      overallScore,
      fieldValidation,
      recommendations
    };
  }

  /**
   * Enhanced text extraction with preprocessing
   */
  async extractTextEnhanced(
    imageFile: File,
    options: {
      preprocess?: boolean;
      language?: string;
      pageSegMode?: number;
      whitelist?: string;
    } = {}
  ): Promise<TextExtraction> {
    await this.initialize();

    if (options.preprocess && this.worker) {
      // Preprocess image for better OCR
      const processedFile = await this.preprocessImage(imageFile);
      return this.extractText(processedFile);
    }

    return this.extractText(imageFile);
  }

  /**
   * Detect specific document patterns (dates, IDs, names)
   */
  detectDocumentPatterns(text: string): {
    dates: string[];
    ids: string[];
    names: string[];
    addresses: string[];
    phones: string[];
    emails: string[];
  } {
    const patterns = {
      dates: [
        /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
        /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/gi,
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/gi
      ],
      ids: [
        /\b[A-Z]{2}\d{6,}\b/g, // State ID pattern
        /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // Aadhaar-like pattern
        /\b[A-Z]{5}\d{4}[A-Z]\b/g // PAN-like pattern
      ],
      names: [
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\b/g // Basic name pattern
      ],
      phones: [
        /\b[\+]?[1-9]?[0-9]{2,3}[-.\s]?\(?[0-9]{3,4}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}\b/g
      ],
      emails: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      ]
    };

    const results: any = {};
    
    Object.entries(patterns).forEach(([key, patternArray]) => {
      const matches: string[] = [];
      patternArray.forEach(pattern => {
        const found = text.match(pattern) || [];
        matches.push(...found);
      });
      results[key] = [...new Set(matches)]; // Remove duplicates
    });

    // Address detection (more complex)
    results.addresses = this.detectAddresses(text);

    return results;
  }

  /**
   * Analyze text quality metrics
   */
  private analyzeTextQuality(textRegions: TextRegion[], fullText: string): TextExtraction['textQuality'] {
    if (textRegions.length === 0) {
      return {
        clear: false,
        completelyVisible: false,
        handwrittenReadable: false,
        printedReadable: false,
        averageConfidence: 0
      };
    }

    const averageConfidence = textRegions.reduce((sum, region) => sum + region.confidence, 0) / textRegions.length;
    const handwrittenRegions = textRegions.filter(r => r.type === 'handwritten');
    const printedRegions = textRegions.filter(r => r.type === 'printed');

    // Check for cut-off text (words at edges with low confidence)
    const edgeWords = textRegions.filter(r => 
      r.bbox.x0 < 10 || r.bbox.y0 < 10 || r.confidence < 30
    );
    const completelyVisible = edgeWords.length < textRegions.length * 0.1;

    return {
      clear: averageConfidence > 70,
      completelyVisible,
      handwrittenReadable: handwrittenRegions.length === 0 || 
                          handwrittenRegions.every(r => r.confidence > 50),
      printedReadable: printedRegions.length === 0 || 
                      printedRegions.every(r => r.confidence > 60),
      averageConfidence
    };
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string, quality: TextExtraction['textQuality']): number {
    let score = 10;

    // Penalize based on text quality
    if (!quality.clear) score -= 3;
    if (!quality.completelyVisible) score -= 2;
    if (!quality.handwrittenReadable) score -= 2;
    if (!quality.printedReadable) score -= 2;

    // Consider text length (very short might be incomplete)
    if (text.length < 10) score -= 2;

    // Consider confidence
    score = score * (quality.averageConfidence / 100);

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Extract required fields from text
   */
  private extractRequiredFields(text: string, requiredFields: RequiredField[]): TextExtraction['requiredFields'] {
    const found: { [key: string]: string } = {};
    const missing: string[] = [];
    const partial: { [key: string]: string } = {};

    requiredFields.forEach(field => {
      let fieldValue = '';
      let foundMatch = false;

      // Try each pattern for the field
      field.patterns.forEach(pattern => {
        if (!foundMatch) {
          const matches = text.match(pattern);
          if (matches && matches[0]) {
            fieldValue = matches[0].trim();
            foundMatch = true;
          }
        }
      });

      // Check aliases as fallback
      if (!foundMatch && field.aliases) {
        field.aliases.forEach(alias => {
          const aliasRegex = new RegExp(`${alias}[:\\s]+([^\\n\\r]+)`, 'gi');
          const match = text.match(aliasRegex);
          if (match && match[1]) {
            fieldValue = match[1].trim();
            foundMatch = true;
          }
        });
      }

      if (foundMatch) {
        found[field.name] = fieldValue;
      } else if (field.required) {
        missing.push(field.name);
      }
    });

    return { found, missing, partial };
  }

  /**
   * Validate individual field
   */
  private validateField(extraction: TextExtraction, field: RequiredField): TextValidation['fieldValidation'][string] {
    const value = extraction.requiredFields.found[field.name] || '';
    const found = !!value;
    let confidence = 100;
    let format: 'valid' | 'invalid' | 'questionable' = 'valid';
    const suggestions: string[] = [];

    if (!found) {
      return {
        found: false,
        value: '',
        confidence: 0,
        format: 'invalid',
        suggestions: [`Please ensure ${field.displayName} is clearly visible in the document`]
      };
    }

    // Format validation based on field type
    switch (field.format) {
      case 'date':
        if (!this.isValidDate(value)) {
          format = 'invalid';
          suggestions.push('Date format should be DD/MM/YYYY or similar');
        }
        break;
      case 'number':
        if (!/^\d+$/.test(value.replace(/\s/g, ''))) {
          format = 'questionable';
          suggestions.push('Should contain only numbers');
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          format = 'invalid';
          suggestions.push('Please provide a valid email format');
        }
        break;
      case 'phone':
        if (!this.isValidPhone(value)) {
          format = 'questionable';
          suggestions.push('Phone number format may be incorrect');
        }
        break;
    }

    // Calculate confidence based on OCR confidence for this text region
    const matchingRegion = extraction.textRegions.find(region => 
      region.text.includes(value) || value.includes(region.text)
    );
    if (matchingRegion) {
      confidence = matchingRegion.confidence;
    }

    return {
      found,
      value,
      confidence,
      format,
      suggestions
    };
  }

  /**
   * Detect text type (printed vs handwritten)
   */
  private detectTextType(text: string): 'printed' | 'handwritten' | 'mixed' {
    // Simple heuristic: handwritten text tends to have more irregular spacing
    // In a real implementation, this would use ML models
    const hasIrregularSpacing = /\s{2,}|\s[a-z]/.test(text);
    const hasConnectedChars = /[a-z]{4,}/.test(text.toLowerCase());
    
    if (hasIrregularSpacing && !hasConnectedChars) {
      return 'handwritten';
    }
    return 'printed';
  }

  /**
   * Detect language of text
   */
  private detectLanguage(text: string): TextExtraction['languageDetection'] {
    // Basic language detection - could be enhanced with proper NLP libraries
    const hindiPattern = /[\u0900-\u097F]/g;
    const englishPattern = /[a-zA-Z]/g;
    
    const hindiMatches = text.match(hindiPattern) || [];
    const englishMatches = text.match(englishPattern) || [];
    
    if (hindiMatches.length > englishMatches.length) {
      return {
        primary: 'hindi',
        confidence: 0.8,
        mixed: englishMatches.length > 0
      };
    } else if (englishMatches.length > 0) {
      return {
        primary: 'english',
        confidence: 0.8,
        mixed: hindiMatches.length > 0
      };
    }
    
    return {
      primary: 'unknown',
      confidence: 0.1,
      mixed: false
    };
  }

  /**
   * Preprocess image for better OCR
   */
  private async preprocessImage(file: File): Promise<File> {
    // Basic preprocessing - enhance contrast, remove noise
    // This is a placeholder - real implementation would use image processing libraries
    return file;
  }

  /**
   * Detect addresses in text
   */
  private detectAddresses(text: string): string[] {
    // Basic address detection patterns
    const addressPatterns = [
      /\b\d+[\/\-\s][A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Za-z\s]+[-\s]*\d{6}\b/g,
      /\b[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Za-z\s]+[-\s]*\d{6}\b/g
    ];

    const addresses: string[] = [];
    addressPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      addresses.push(...matches);
    });

    return [...new Set(addresses)];
  }

  // Validation helper methods
  private isValidDate(dateStr: string): boolean {
    return !isNaN(Date.parse(dateStr.replace(/[-/.]/g, '/')));
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^[\+]?[1-9]?[0-9]{7,14}$/.test(phone.replace(/[-.\s()]/g, ''));
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}