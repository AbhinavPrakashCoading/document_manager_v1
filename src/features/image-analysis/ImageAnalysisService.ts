/**
 * Phase 1: Intelligent Image Analysis Service
 * Teaching the system to "see" and detect image quality issues
 */

'use client';

import toast from 'react-hot-toast';

export interface ImageAnalysisResult {
  overall: {
    score: number; // 0-10, where 10 is perfect
    status: 'excellent' | 'good' | 'poor' | 'unusable';
    canProceed: boolean;
    confidence: number;
  };
  blur: {
    score: number; // 0-10, where 10 is sharpest
    isBlurry: boolean;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    message: string;
  };
  brightness: {
    score: number; // 0-10, where 5 is ideal
    level: 'too-dark' | 'dark' | 'ideal' | 'bright' | 'too-bright';
    isUsable: boolean;
    message: string;
  };
  contrast: {
    score: number; // 0-10, where 10 is best contrast
    level: 'very-low' | 'low' | 'good' | 'high' | 'very-high';
    isUsable: boolean;
    message: string;
  };
  orientation: {
    rotation: number; // degrees clockwise
    isUpsideDown: boolean;
    needsRotation: boolean;
    suggestedRotation: number;
    message: string;
  };
  fileHealth: {
    isCorrupted: boolean;
    isComplete: boolean;
    format: string;
    isSupported: boolean;
    message: string;
  };
  recommendations: string[];
  processingTime: number;
}

export interface ImageAnalysisOptions {
  checkBlur: boolean;
  checkBrightness: boolean;
  checkContrast: boolean;
  checkOrientation: boolean;
  checkFileHealth: boolean;
  strictMode: boolean; // More stringent quality requirements
  documentType?: 'photo' | 'document' | 'signature' | 'any';
}

class ImageAnalysisService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    // Initialize canvas for image processing (browser only)
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Analyze an image file for quality issues
   */
  async analyzeImage(
    file: File,
    options: ImageAnalysisOptions = this.getDefaultOptions()
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Load image into canvas for analysis
      const imageData = await this.loadImageToCanvas(file);
      if (!imageData) {
        throw new Error('Failed to load image for analysis');
      }

      const { imgElement, canvas, ctx } = imageData;
      
      // Initialize result structure
      const result: ImageAnalysisResult = {
        overall: { score: 0, status: 'unusable', canProceed: false, confidence: 0 },
        blur: { score: 0, isBlurry: true, severity: 'severe', message: '' },
        brightness: { score: 0, level: 'too-dark', isUsable: false, message: '' },
        contrast: { score: 0, level: 'very-low', isUsable: false, message: '' },
        orientation: { rotation: 0, isUpsideDown: false, needsRotation: false, suggestedRotation: 0, message: '' },
        fileHealth: { isCorrupted: false, isComplete: true, format: '', isSupported: true, message: '' },
        recommendations: [],
        processingTime: 0
      };

      // Get image pixel data for analysis
      const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Run individual analysis checks
      if (options.checkFileHealth) {
        result.fileHealth = await this.checkFileHealth(file, imgElement);
      }

      if (options.checkBlur) {
        result.blur = this.checkBlurLevel(pixelData, options);
      }

      if (options.checkBrightness) {
        result.brightness = this.checkBrightness(pixelData, options);
      }

      if (options.checkContrast) {
        result.contrast = this.checkContrast(pixelData, options);
      }

      if (options.checkOrientation) {
        result.orientation = await this.checkOrientation(pixelData, imgElement, options);
      }

      // Calculate overall score and recommendations
      result.overall = this.calculateOverallScore(result, options);
      result.recommendations = this.generateRecommendations(result, options);
      result.processingTime = Date.now() - startTime;

      // Cleanup
      URL.revokeObjectURL(imgElement.src);

      return result;

    } catch (error) {
      console.error('Image analysis failed:', error);
      
      return {
        overall: { score: 0, status: 'unusable', canProceed: false, confidence: 0 },
        blur: { score: 0, isBlurry: true, severity: 'severe', message: 'Analysis failed' },
        brightness: { score: 0, level: 'too-dark', isUsable: false, message: 'Analysis failed' },
        contrast: { score: 0, level: 'very-low', isUsable: false, message: 'Analysis failed' },
        orientation: { rotation: 0, isUpsideDown: false, needsRotation: false, suggestedRotation: 0, message: 'Analysis failed' },
        fileHealth: { isCorrupted: true, isComplete: false, format: file.type, isSupported: false, message: error instanceof Error ? error.message : 'Unknown error' },
        recommendations: ['Please try uploading the image again'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Load image file into canvas for pixel analysis
   */
  private async loadImageToCanvas(file: File): Promise<{
    imgElement: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } | null> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        resolve({ imgElement: img, canvas, ctx });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Check if image is blurry using Laplacian variance
   */
  private checkBlurLevel(imageData: ImageData, options: ImageAnalysisOptions): ImageAnalysisResult['blur'] {
    const { data, width, height } = imageData;
    
    // Convert to grayscale and calculate Laplacian variance
    let variance = 0;
    let mean = 0;
    let count = 0;

    // Sample pixels for performance (every 4th pixel)
    for (let y = 1; y < height - 1; y += 4) {
      for (let x = 1; x < width - 1; x += 4) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Calculate Laplacian (edge detection)
        const laplacian = Math.abs(
          -4 * gray +
          data[((y-1) * width + x) * 4] + // top
          data[((y+1) * width + x) * 4] + // bottom  
          data[(y * width + (x-1)) * 4] + // left
          data[(y * width + (x+1)) * 4]   // right
        );
        
        variance += laplacian;
        count++;
      }
    }

    variance = variance / count;

    // Normalize blur score (0-10, where 10 is sharpest)
    const normalizedScore = Math.min(10, Math.max(0, variance / 50));
    const score = Math.round(normalizedScore * 10) / 10;

    // Determine blur severity
    let severity: ImageAnalysisResult['blur']['severity'];
    let isBlurry: boolean;
    let message: string;

    if (score >= 7) {
      severity = 'none';
      isBlurry = false;
      message = `Image is sharp and clear (${score}/10)`;
    } else if (score >= 5) {
      severity = 'mild';
      isBlurry = options.strictMode;
      message = `Image has slight blur but is usable (${score}/10)`;
    } else if (score >= 3) {
      severity = 'moderate';
      isBlurry = true;
      message = `Image is moderately blurry (${score}/10) - please retake with steadier hands`;
    } else {
      severity = 'severe';
      isBlurry = true;
      message = `Image is very blurry (${score}/10) - please retake with steadier hands and better focus`;
    }

    return { score, isBlurry, severity, message };
  }

  /**
   * Check image brightness levels
   */
  private checkBrightness(imageData: ImageData, options: ImageAnalysisOptions): ImageAnalysisResult['brightness'] {
    const { data } = imageData;
    let totalBrightness = 0;
    let sampleCount = 0;

    // Sample every 16th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      sampleCount++;
    }

    const avgBrightness = totalBrightness / sampleCount;
    
    // Normalize to 0-10 scale (5 is ideal)
    const score = Math.round((avgBrightness / 255) * 10 * 10) / 10;
    
    let level: ImageAnalysisResult['brightness']['level'];
    let isUsable: boolean;
    let message: string;

    if (score < 1.5) {
      level = 'too-dark';
      isUsable = false;
      message = `Image is too dark (${score}/10) - try better lighting`;
    } else if (score < 3) {
      level = 'dark';
      isUsable = !options.strictMode;
      message = `Image is dark (${score}/10) - consider brighter lighting`;
    } else if (score <= 7) {
      level = 'ideal';
      isUsable = true;
      message = `Image brightness is good (${score}/10)`;
    } else if (score <= 8.5) {
      level = 'bright';
      isUsable = !options.strictMode;
      message = `Image is bright (${score}/10) - still usable`;
    } else {
      level = 'too-bright';
      isUsable = false;
      message = `Image is too bright/washed out (${score}/10) - reduce lighting`;
    }

    return { score, level, isUsable, message };
  }

  /**
   * Check image contrast levels
   */
  private checkContrast(imageData: ImageData, options: ImageAnalysisOptions): ImageAnalysisResult['contrast'] {
    const { data } = imageData;
    let min = 255;
    let max = 0;

    // Sample pixels to find min/max brightness
    for (let i = 0; i < data.length; i += 12) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
    }

    const contrast = max - min;
    const score = Math.round((contrast / 255) * 10 * 10) / 10;

    let level: ImageAnalysisResult['contrast']['level'];
    let isUsable: boolean;
    let message: string;

    if (score < 2) {
      level = 'very-low';
      isUsable = false;
      message = `Very low contrast (${score}/10) - image appears flat`;
    } else if (score < 4) {
      level = 'low';
      isUsable = !options.strictMode;
      message = `Low contrast (${score}/10) - consider better lighting`;
    } else if (score <= 8) {
      level = 'good';
      isUsable = true;
      message = `Good contrast (${score}/10)`;
    } else if (score <= 9) {
      level = 'high';
      isUsable = true;
      message = `High contrast (${score}/10)`;
    } else {
      level = 'very-high';
      isUsable = !options.strictMode;
      message = `Very high contrast (${score}/10) - may be too harsh`;
    }

    return { score, level, isUsable, message };
  }

  /**
   * Check image orientation and detect if upside-down
   */
  private async checkOrientation(
    imageData: ImageData, 
    imgElement: HTMLImageElement,
    options: ImageAnalysisOptions
  ): Promise<ImageAnalysisResult['orientation']> {
    const { width, height, data } = imageData;
    
    // Enhanced orientation detection using edge analysis
    let rotation = 0;
    let isUpsideDown = false;
    let needsRotation = false;
    let suggestedRotation = 0;
    let message = 'Image orientation appears normal';

    // Check for obvious upside-down indicators using pixel analysis
    // Sample top and bottom sections to detect text/content orientation
    const topSection = this.analyzeImageSection(data, width, height, 0, 0.2);
    const bottomSection = this.analyzeImageSection(data, width, height, 0.8, 1.0);
    
    // If bottom section has more "text-like" features than top, likely upside-down
    if (bottomSection.textLikeness > topSection.textLikeness * 1.5) {
      isUpsideDown = true;
      needsRotation = true;
      suggestedRotation = 180;
      message = 'Image appears upside-down - rotate 180 degrees';
    }
    
    // Check aspect ratio for document orientation
    const aspectRatio = width / height;
    if (options.documentType === 'document') {
      if (aspectRatio > 1.3) {
        // Document is in landscape but might need to be portrait
        needsRotation = true;
        suggestedRotation = 90;
        message = 'Document may need rotation - try rotating 90 degrees clockwise';
      }
    }

    // Check for severely tilted images using edge analysis
    const tiltAngle = this.detectTilt(data, width, height);
    if (Math.abs(tiltAngle) > 15) {
      needsRotation = true;
      rotation = tiltAngle;
      suggestedRotation = -tiltAngle; // Correct the tilt
      message = `Image is tilted ${Math.abs(tiltAngle).toFixed(0)}° - straighten before uploading`;
    }

    return {
      rotation,
      isUpsideDown,
      needsRotation,
      suggestedRotation,
      message
    };
  }

  /**
   * Analyze a section of the image for text-like features
   */
  private analyzeImageSection(data: Uint8ClampedArray, width: number, height: number, startY: number, endY: number) {
    const startRow = Math.floor(height * startY);
    const endRow = Math.floor(height * endY);
    let edgeCount = 0;
    let totalPixels = 0;

    for (let y = startRow; y < endRow; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        
        if (Math.abs(current - right) > 30) {
          edgeCount++;
        }
        totalPixels++;
      }
    }

    return {
      textLikeness: edgeCount / totalPixels,
      edgeCount,
      totalPixels
    };
  }

  /**
   * Detect image tilt using edge analysis
   */
  private detectTilt(data: Uint8ClampedArray, width: number, height: number): number {
    // Simplified tilt detection - would use Hough transform in production
    // For now, return 0 (no tilt detected)
    // TODO: Implement proper Hough line detection
    return 0;
  }

  /**
   * Check file health and integrity
   */
  private async checkFileHealth(
    file: File,
    imgElement: HTMLImageElement
  ): Promise<ImageAnalysisResult['fileHealth']> {
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    
    const isSupported = supportedFormats.includes(file.type.toLowerCase());
    const isComplete = imgElement.complete && imgElement.naturalWidth > 0;
    const isCorrupted = !isComplete;

    let message = '';
    if (isCorrupted) {
      message = 'Image file appears to be corrupted or incomplete';
    } else if (!isSupported) {
      message = `File format ${file.type} may not be fully supported`;
    } else {
      message = 'Image file is healthy and complete';
    }

    return {
      isCorrupted,
      isComplete,
      format: file.type,
      isSupported,
      message
    };
  }

  /**
   * Calculate overall image quality score
   */
  private calculateOverallScore(
    result: ImageAnalysisResult,
    options: ImageAnalysisOptions
  ): ImageAnalysisResult['overall'] {
    const weights = {
      blur: 0.3,
      brightness: 0.25,
      contrast: 0.2,
      orientation: 0.1,
      fileHealth: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;
    let canProceed = true;

    // File health is critical
    if (!result.fileHealth.isComplete || result.fileHealth.isCorrupted) {
      canProceed = false;
    }

    if (options.checkBlur) {
      totalScore += result.blur.score * weights.blur;
      totalWeight += weights.blur;
      if (result.blur.isBlurry && options.strictMode) canProceed = false;
    }

    if (options.checkBrightness) {
      totalScore += result.brightness.score * weights.brightness;
      totalWeight += weights.brightness;
      if (!result.brightness.isUsable) canProceed = false;
    }

    if (options.checkContrast) {
      totalScore += result.contrast.score * weights.contrast;
      totalWeight += weights.contrast;
      if (!result.contrast.isUsable) canProceed = false;
    }

    const score = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    let status: ImageAnalysisResult['overall']['status'];
    if (score >= 7) status = 'excellent';
    else if (score >= 5.5) status = 'good';
    else if (score >= 3) status = 'poor';
    else status = 'unusable';

    // Override status if cannot proceed
    if (!canProceed) status = 'unusable';

    return {
      score: Math.round(score * 10) / 10,
      status,
      canProceed,
      confidence: Math.min(1, totalWeight)
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    result: ImageAnalysisResult,
    options: ImageAnalysisOptions
  ): string[] {
    const recommendations: string[] = [];

    if (result.fileHealth.isCorrupted) {
      recommendations.push('File appears corrupted - try uploading again');
    }

    if (result.blur.isBlurry) {
      if (result.blur.severity === 'severe') {
        recommendations.push('Image is very blurry - hold camera steadier and ensure good focus');
      } else {
        recommendations.push('Image is slightly blurry - please retake with steadier hands');
      }
    }

    if (!result.brightness.isUsable) {
      if (result.brightness.level === 'too-dark') {
        recommendations.push('Image is too dark - try better lighting or use flash');
      } else if (result.brightness.level === 'too-bright') {
        recommendations.push('Image is overexposed - try reducing lighting or move away from bright light');
      } else if (result.brightness.level === 'dark') {
        recommendations.push('Image is dark - consider brighter lighting for better results');
      }
    }

    if (!result.contrast.isUsable) {
      if (result.contrast.level === 'very-low' || result.contrast.level === 'low') {
        recommendations.push('Image lacks contrast - try better lighting with proper shadows and highlights');
      }
    }

    if (result.orientation.needsRotation) {
      if (result.orientation.isUpsideDown) {
        recommendations.push('Image appears upside-down - rotate 180 degrees');
      } else if (result.orientation.suggestedRotation === 90) {
        recommendations.push('Document orientation - try rotating 90 degrees clockwise');
      } else if (result.orientation.suggestedRotation === -90) {
        recommendations.push('Document orientation - try rotating 90 degrees counter-clockwise');
      } else {
        recommendations.push(`Image is tilted - straighten by ${Math.abs(result.orientation.suggestedRotation)}°`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Image quality looks good!');
    }

    return recommendations;
  }

  /**
   * Get default analysis options
   */
  private getDefaultOptions(): ImageAnalysisOptions {
    return {
      checkBlur: true,
      checkBrightness: true,
      checkContrast: true,
      checkOrientation: true,
      checkFileHealth: true,
      strictMode: false,
      documentType: 'any'
    };
  }

  /**
   * Quick analysis with basic checks only
   */
  async quickAnalysis(file: File): Promise<ImageAnalysisResult> {
    return this.analyzeImage(file, {
      checkBlur: true,
      checkBrightness: true,
      checkContrast: false,
      checkOrientation: false,
      checkFileHealth: true,
      strictMode: false,
      documentType: 'any'
    });
  }

  /**
   * Strict analysis for document processing
   */
  async strictAnalysis(file: File, documentType: 'photo' | 'document' | 'signature' = 'document'): Promise<ImageAnalysisResult> {
    return this.analyzeImage(file, {
      checkBlur: true,
      checkBrightness: true,
      checkContrast: true,
      checkOrientation: true,
      checkFileHealth: true,
      strictMode: true,
      documentType
    });
  }
}

// Export singleton instance
export const imageAnalysisService = new ImageAnalysisService();

// Export for testing and utilities
export { ImageAnalysisService };