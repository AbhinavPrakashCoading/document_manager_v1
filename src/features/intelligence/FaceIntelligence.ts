/**
 * Phase 2: Face Intelligence System
 * AI-powered face detection and passport photo validation
 */

'use client';

import * as faceapi from 'face-api.js';

export interface FaceAnalysis {
  faceCount: number;
  primaryFace: {
    visible: boolean;
    frontFacing: boolean;
    eyesOpen: boolean;
    mouthClosed: boolean;
    qualityScore: number; // 0-10
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks: {
      eyes: { left: Point; right: Point };
      nose: Point;
      mouth: Point;
    };
  } | null;
  backgroundAnalysis: {
    uniform: boolean;
    backgroundColor: string;
    dominantColor: string;
    colorVariance: number;
    distractions: string[]; // ["shadows", "objects", "patterns"]
  };
  complianceCheck: {
    passportPhotoCompliant: boolean;
    issues: string[];
    score: number; // 0-10
  };
  recommendations: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PassportPhotoValidation {
  isCompliant: boolean;
  overallScore: number;
  analysis: FaceAnalysis;
  detailedIssues: {
    faceIssues: string[];
    backgroundIssues: string[];
    positioningIssues: string[];
    qualityIssues: string[];
  };
}

export class FaceIntelligence {
  private isInitialized = false;
  private modelPath = '/models'; // Path to face-api.js models

  /**
   * Initialize face-api.js models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load face-api.js models
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath);
      await faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath);
      
      this.isInitialized = true;
      console.log('Face Intelligence initialized successfully');
    } catch (error) {
      console.warn('Face-api.js models not available, using fallback detection:', error);
      // Continue with basic analysis without face-api.js
      this.isInitialized = true;
    }
  }

  /**
   * Analyze face in image for passport photo validation
   */
  async analyzeFace(imageFile: File): Promise<FaceAnalysis> {
    await this.initialize();

    // Create image element for analysis
    const img = await this.loadImage(imageFile);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Perform face detection
    const faceDetection = await this.detectFaces(img);
    
    // Analyze background
    const backgroundAnalysis = this.analyzeBackground(imageData);
    
    // Generate compliance check
    const complianceCheck = this.checkPassportCompliance(faceDetection, backgroundAnalysis);
    
    // Generate recommendations
    const recommendations = this.generateFaceRecommendations(faceDetection, backgroundAnalysis, complianceCheck);

    return {
      faceCount: faceDetection.faceCount,
      primaryFace: faceDetection.primaryFace,
      backgroundAnalysis,
      complianceCheck,
      recommendations
    };
  }

  /**
   * Validate passport photo comprehensively
   */
  async validatePassportPhoto(imageFile: File): Promise<PassportPhotoValidation> {
    const analysis = await this.analyzeFace(imageFile);
    
    const detailedIssues = {
      faceIssues: [] as string[],
      backgroundIssues: [] as string[],
      positioningIssues: [] as string[],
      qualityIssues: [] as string[]
    };

    // Categorize issues
    if (analysis.faceCount === 0) {
      detailedIssues.faceIssues.push('No face detected in image');
    } else if (analysis.faceCount > 1) {
      detailedIssues.faceIssues.push(`Multiple faces detected (${analysis.faceCount}) - only one person allowed`);
    }

    if (analysis.primaryFace && analysis.primaryFace.qualityScore < 6) {
      detailedIssues.qualityIssues.push('Face quality is poor - ensure clear visibility');
    }

    if (!analysis.backgroundAnalysis.uniform) {
      detailedIssues.backgroundIssues.push('Background is not uniform - use plain white background');
    }

    if (analysis.backgroundAnalysis.dominantColor.toLowerCase() !== '#ffffff' && 
        !this.isNearWhite(analysis.backgroundAnalysis.dominantColor)) {
      detailedIssues.backgroundIssues.push('Background should be white or very light colored');
    }

    // Calculate overall score
    let overallScore = 10;
    overallScore -= detailedIssues.faceIssues.length * 3;
    overallScore -= detailedIssues.backgroundIssues.length * 2;
    overallScore -= detailedIssues.positioningIssues.length * 2;
    overallScore -= detailedIssues.qualityIssues.length * 1;
    overallScore = Math.max(0, Math.min(10, overallScore));

    return {
      isCompliant: analysis.complianceCheck.passportPhotoCompliant,
      overallScore,
      analysis,
      detailedIssues
    };
  }

  /**
   * Detect faces in image
   */
  private async detectFaces(img: HTMLImageElement): Promise<{
    faceCount: number;
    primaryFace: FaceAnalysis['primaryFace'];
  }> {
    try {
      if (this.isInitialized) {
        // Use face-api.js for detection
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections.length === 0) {
          return { faceCount: 0, primaryFace: null };
        }

        // Get primary (largest) face
        const primaryDetection = detections.reduce((largest, current) => 
          current.detection.box.area > largest.detection.box.area ? current : largest
        );

        const landmarks = primaryDetection.landmarks;
        const expressions = primaryDetection.expressions;

        const primaryFace: FaceAnalysis['primaryFace'] = {
          visible: true,
          frontFacing: this.isFrontFacing(landmarks),
          eyesOpen: expressions.surprised + expressions.happy + expressions.neutral > 0.3,
          mouthClosed: expressions.sad + expressions.neutral + expressions.angry > expressions.happy,
          qualityScore: this.calculateFaceQuality(primaryDetection),
          position: {
            x: primaryDetection.detection.box.x,
            y: primaryDetection.detection.box.y,
            width: primaryDetection.detection.box.width,
            height: primaryDetection.detection.box.height
          },
          landmarks: {
            eyes: {
              left: { x: landmarks.getLeftEye()[0].x, y: landmarks.getLeftEye()[0].y },
              right: { x: landmarks.getRightEye()[0].x, y: landmarks.getRightEye()[0].y }
            },
            nose: { x: landmarks.getNose()[0].x, y: landmarks.getNose()[0].y },
            mouth: { x: landmarks.getMouth()[0].x, y: landmarks.getMouth()[0].y }
          }
        };

        return {
          faceCount: detections.length,
          primaryFace
        };
      }
    } catch (error) {
      console.warn('Face detection failed, using fallback:', error);
    }

    // Fallback: Basic face detection using color analysis
    return this.fallbackFaceDetection(img);
  }

  /**
   * Fallback face detection without face-api.js
   */
  private fallbackFaceDetection(img: HTMLImageElement): {
    faceCount: number;
    primaryFace: FaceAnalysis['primaryFace'];
  } {
    // Simple heuristic: assume if image is portrait orientation and 
    // has skin-tone colors, it likely contains a face
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const skinTonePixels = this.detectSkinTones(imageData);
    
    if (skinTonePixels > 0.1) { // 10% skin tone pixels
      return {
        faceCount: 1,
        primaryFace: {
          visible: true,
          frontFacing: true,
          eyesOpen: true,
          mouthClosed: true,
          qualityScore: 7, // Default reasonable score
          position: {
            x: canvas.width * 0.25,
            y: canvas.height * 0.2,
            width: canvas.width * 0.5,
            height: canvas.height * 0.6
          },
          landmarks: {
            eyes: {
              left: { x: canvas.width * 0.4, y: canvas.height * 0.35 },
              right: { x: canvas.width * 0.6, y: canvas.height * 0.35 }
            },
            nose: { x: canvas.width * 0.5, y: canvas.height * 0.45 },
            mouth: { x: canvas.width * 0.5, y: canvas.height * 0.55 }
          }
        }
      };
    }

    return { faceCount: 0, primaryFace: null };
  }

  /**
   * Analyze background uniformity and color
   */
  private analyzeBackground(imageData: ImageData): FaceAnalysis['backgroundAnalysis'] {
    const { data, width, height } = imageData;
    const colors: { [key: string]: number } = {};
    let totalPixels = 0;
    
    // Sample edge pixels to analyze background
    const edgePixels = [];
    
    // Top edge
    for (let x = 0; x < width; x += 5) {
      const idx = x * 4;
      edgePixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
    
    // Bottom edge
    for (let x = 0; x < width; x += 5) {
      const idx = ((height - 1) * width + x) * 4;
      edgePixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
    
    // Left and right edges
    for (let y = 0; y < height; y += 5) {
      // Left edge
      let idx = (y * width) * 4;
      edgePixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      
      // Right edge
      idx = (y * width + width - 1) * 4;
      edgePixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }

    // Calculate dominant color and variance
    const colorCounts: { [key: string]: number } = {};
    edgePixels.forEach(pixel => {
      const colorKey = this.rgbToHex(pixel.r, pixel.g, pixel.b);
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    });

    const dominantColor = Object.keys(colorCounts).reduce((a, b) => 
      colorCounts[a] > colorCounts[b] ? a : b
    );

    // Calculate color variance to determine uniformity
    const dominantRgb = this.hexToRgb(dominantColor);
    let variance = 0;
    edgePixels.forEach(pixel => {
      const diff = Math.sqrt(
        Math.pow(pixel.r - dominantRgb.r, 2) +
        Math.pow(pixel.g - dominantRgb.g, 2) +
        Math.pow(pixel.b - dominantRgb.b, 2)
      );
      variance += diff;
    });
    variance /= edgePixels.length;

    const uniform = variance < 30; // Threshold for uniformity
    const distractions = [];
    
    if (variance > 50) distractions.push('high_color_variation');
    if (!this.isNearWhite(dominantColor)) distractions.push('non_white_background');
    
    return {
      uniform,
      backgroundColor: dominantColor,
      dominantColor,
      colorVariance: variance,
      distractions
    };
  }

  /**
   * Check passport photo compliance
   */
  private checkPassportCompliance(
    faceDetection: { faceCount: number; primaryFace: FaceAnalysis['primaryFace'] },
    backgroundAnalysis: FaceAnalysis['backgroundAnalysis']
  ): FaceAnalysis['complianceCheck'] {
    const issues: string[] = [];
    let score = 10;

    // Face count check
    if (faceDetection.faceCount === 0) {
      issues.push('No face detected');
      score -= 5;
    } else if (faceDetection.faceCount > 1) {
      issues.push('Multiple faces detected - only one person allowed');
      score -= 4;
    }

    // Face quality check
    if (faceDetection.primaryFace && faceDetection.primaryFace.qualityScore < 6) {
      issues.push('Face quality is insufficient');
      score -= 2;
    }

    // Background checks
    if (!backgroundAnalysis.uniform) {
      issues.push('Background is not uniform');
      score -= 2;
    }

    if (!this.isNearWhite(backgroundAnalysis.dominantColor)) {
      issues.push('Background should be white or very light');
      score -= 2;
    }

    // Face positioning (if face detected)
    if (faceDetection.primaryFace) {
      const face = faceDetection.primaryFace;
      if (!face.frontFacing) {
        issues.push('Face should be front-facing');
        score -= 2;
      }
      if (!face.eyesOpen) {
        issues.push('Eyes should be open and visible');
        score -= 1;
      }
    }

    score = Math.max(0, Math.min(10, score));
    const passportPhotoCompliant = issues.length === 0 && score >= 7;

    return {
      passportPhotoCompliant,
      issues,
      score
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateFaceRecommendations(
    faceDetection: { faceCount: number; primaryFace: FaceAnalysis['primaryFace'] },
    backgroundAnalysis: FaceAnalysis['backgroundAnalysis'],
    complianceCheck: FaceAnalysis['complianceCheck']
  ): string[] {
    const recommendations: string[] = [];

    if (faceDetection.faceCount === 0) {
      recommendations.push('Ensure your face is clearly visible and well-lit');
      recommendations.push('Position yourself directly facing the camera');
    } else if (faceDetection.faceCount > 1) {
      recommendations.push('Only one person should be in the photo');
      recommendations.push('Remove other people from the frame');
    }

    if (!backgroundAnalysis.uniform) {
      recommendations.push('Use a plain, uniform background');
      recommendations.push('Remove any objects or patterns behind you');
    }

    if (!this.isNearWhite(backgroundAnalysis.dominantColor)) {
      recommendations.push('Use a white or very light colored background');
      recommendations.push('Avoid colored or dark backgrounds');
    }

    if (faceDetection.primaryFace && faceDetection.primaryFace.qualityScore < 6) {
      recommendations.push('Ensure your face is clearly visible and in focus');
      recommendations.push('Use better lighting to illuminate your face evenly');
    }

    if (backgroundAnalysis.distractions.includes('high_color_variation')) {
      recommendations.push('Remove shadows and lighting variations from background');
    }

    if (complianceCheck.score < 7) {
      recommendations.push('Consider retaking the photo to meet passport requirements');
    }

    return recommendations;
  }

  // Helper methods
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private isFrontFacing(landmarks: any): boolean {
    if (!landmarks) return true;
    // Simplified front-facing check based on eye symmetry
    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const eyeDistance = Math.abs(leftEye[0].y - rightEye[0].y);
      return eyeDistance < 10; // Eyes should be roughly level
    } catch {
      return true;
    }
  }

  private calculateFaceQuality(detection: any): number {
    // Simplified quality calculation based on detection confidence and size
    const confidence = detection.detection.score || 0.7;
    const size = detection.detection.box.area;
    const sizeScore = Math.min(1, size / 10000); // Normalize based on expected size
    return Math.round((confidence * 0.6 + sizeScore * 0.4) * 10);
  }

  private detectSkinTones(imageData: ImageData): number {
    const { data } = imageData;
    let skinPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin tone detection
      if (this.isSkinTone(r, g, b)) {
        skinPixels++;
      }
      totalPixels++;
    }

    return skinPixels / totalPixels;
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    // Basic skin tone detection
    return r > 95 && g > 40 && b > 20 && 
           Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
           Math.abs(r - g) > 15 && r > g && r > b;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private isNearWhite(color: string): boolean {
    const rgb = this.hexToRgb(color);
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 240; // Very light/white threshold
  }
}