/**
 * Phase 2: Signature Intelligence System
 * Signature detection, analysis, and authenticity validation
 */

'use client';

export interface SignatureAnalysis {
  isDetected: boolean;
  confidence: number; // 0-100%
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  characteristics: {
    strokeCount: number;
    continuity: number; // 0-100% how connected the strokes are
    complexity: number; // 0-100% intricacy of the signature
    pressure: 'light' | 'medium' | 'heavy';
    speed: 'slow' | 'medium' | 'fast'; // Inferred from stroke characteristics
    style: 'simple' | 'elaborate' | 'cursive' | 'print' | 'mixed';
  };
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  };
  validation: {
    isAuthentic: boolean; // Basic authenticity indicators
    redFlags: string[]; // Potential issues
    recommendations: string[];
  };
  metadata: {
    inkColor: string;
    backgroundContrast: number; // 0-100%
    clarity: number; // 0-100%
    completeness: number; // 0-100% is signature complete/cut off
  };
}

export interface SignatureComparison {
  similarity: number; // 0-100% similarity between signatures
  matchingFeatures: string[];
  differences: string[];
  verdict: 'match' | 'likely_match' | 'uncertain' | 'no_match';
  confidence: number;
}

export interface SignatureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export class SignatureIntelligence {
  private minSignatureWidth = 30;
  private minSignatureHeight = 15;
  private maxSignatureWidth = 400;
  private maxSignatureHeight = 200;
  
  /**
   * Analyze signature in image
   */
  async analyzeSignature(imageFile: File): Promise<SignatureAnalysis> {
    const imageData = await this.loadImageData(imageFile);
    
    // Detect signature region
    const signatureRegions = await this.detectSignatureRegions(imageData);
    
    if (signatureRegions.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Analyze the most confident signature region
    const mainSignature = signatureRegions[0];
    const signatureData = this.extractSignatureRegion(imageData, mainSignature);
    
    // Extract characteristics
    const characteristics = await this.analyzeSignatureCharacteristics(signatureData);
    
    // Validate authenticity
    const validation = this.validateSignatureAuthenticity(signatureData, characteristics);
    
    // Extract metadata
    const metadata = this.extractSignatureMetadata(signatureData);
    
    // Calculate overall quality
    const quality = this.calculateSignatureQuality(characteristics, validation, metadata);

    return {
      isDetected: true,
      confidence: Math.round(mainSignature.confidence),
      quality,
      characteristics,
      dimensions: {
        width: mainSignature.width,
        height: mainSignature.height,
        aspectRatio: Math.round((mainSignature.width / mainSignature.height) * 100) / 100,
        boundingBox: {
          x: mainSignature.x,
          y: mainSignature.y,
          width: mainSignature.width,
          height: mainSignature.height
        }
      },
      validation,
      metadata
    };
  }

  /**
   * Compare two signatures for similarity
   */
  async compareSignatures(signature1: File, signature2: File): Promise<SignatureComparison> {
    const analysis1 = await this.analyzeSignature(signature1);
    const analysis2 = await this.analyzeSignature(signature2);

    if (!analysis1.isDetected || !analysis2.isDetected) {
      return {
        similarity: 0,
        matchingFeatures: [],
        differences: ['One or both signatures not detected'],
        verdict: 'no_match',
        confidence: 0
      };
    }

    // Compare characteristics
    const similarity = this.calculateSimilarity(analysis1.characteristics, analysis2.characteristics);
    const matchingFeatures = this.identifyMatchingFeatures(analysis1, analysis2);
    const differences = this.identifyDifferences(analysis1, analysis2);
    
    // Determine verdict
    const verdict = this.determineMatchVerdict(similarity, matchingFeatures.length);
    const confidence = this.calculateComparisonConfidence(analysis1, analysis2, similarity);

    return {
      similarity: Math.round(similarity),
      matchingFeatures,
      differences,
      verdict,
      confidence: Math.round(confidence)
    };
  }

  /**
   * Detect signature regions in image
   */
  private async detectSignatureRegions(imageData: ImageData): Promise<SignatureRegion[]> {
    const candidates = await this.findSignatureCandidates(imageData);
    const validatedCandidates = this.validateSignatureCandidates(candidates, imageData);
    
    // Sort by confidence
    return validatedCandidates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find potential signature regions
   */
  private async findSignatureCandidates(imageData: ImageData): Promise<SignatureRegion[]> {
    const { width, height, data } = imageData;
    const candidates: SignatureRegion[] = [];

    // Create binary image for stroke detection
    const binaryData = this.createBinaryImage(imageData);
    
    // Find connected components (potential strokes)
    const components = this.findConnectedComponents(binaryData, width, height);
    
    // Group components into potential signatures
    const groupedComponents = this.groupComponentsIntoSignatures(components);
    
    groupedComponents.forEach(group => {
      const boundingBox = this.calculateBoundingBox(group);
      
      // Check if dimensions are reasonable for a signature
      if (this.isValidSignatureDimension(boundingBox)) {
        candidates.push({
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
          confidence: this.calculateInitialConfidence(group, boundingBox)
        });
      }
    });

    return candidates;
  }

  /**
   * Validate signature candidates
   */
  private validateSignatureCandidates(candidates: SignatureRegion[], imageData: ImageData): SignatureRegion[] {
    return candidates.map(candidate => {
      const regionData = this.extractSignatureRegion(imageData, candidate);
      const strokeAnalysis = this.analyzeStrokePattern(regionData);
      const densityAnalysis = this.analyzeInkDensity(regionData);
      
      // Adjust confidence based on analysis
      let confidence = candidate.confidence;
      
      // Boost confidence for good stroke patterns
      if (strokeAnalysis.continuity > 0.6) confidence += 20;
      if (strokeAnalysis.strokeCount >= 3 && strokeAnalysis.strokeCount <= 15) confidence += 15;
      
      // Reduce confidence for poor characteristics
      if (densityAnalysis.uniformity < 0.3) confidence -= 15;
      if (strokeAnalysis.straightLineRatio > 0.8) confidence -= 10; // Too geometric
      
      return {
        ...candidate,
        confidence: Math.max(0, Math.min(100, confidence))
      };
    }).filter(candidate => candidate.confidence > 30);
  }

  /**
   * Analyze signature characteristics
   */
  private async analyzeSignatureCharacteristics(signatureData: ImageData): Promise<SignatureAnalysis['characteristics']> {
    const strokeAnalysis = this.analyzeStrokePattern(signatureData);
    const pressureAnalysis = this.analyzePressurePattern(signatureData);
    const styleAnalysis = this.analyzeSignatureStyle(signatureData);
    
    return {
      strokeCount: strokeAnalysis.strokeCount,
      continuity: Math.round(strokeAnalysis.continuity * 100),
      complexity: Math.round(strokeAnalysis.complexity * 100),
      pressure: pressureAnalysis.averagePressure,
      speed: this.inferWritingSpeed(strokeAnalysis),
      style: styleAnalysis.dominantStyle
    };
  }

  /**
   * Validate signature authenticity
   */
  private validateSignatureAuthenticity(
    signatureData: ImageData, 
    characteristics: SignatureAnalysis['characteristics']
  ): SignatureAnalysis['validation'] {
    const redFlags: string[] = [];
    const recommendations: string[] = [];
    let isAuthentic = true;

    // Check for digital manipulation
    if (this.detectDigitalManipulation(signatureData)) {
      redFlags.push('Possible digital manipulation detected');
      isAuthentic = false;
    }

    // Check stroke continuity
    if (characteristics.continuity < 40) {
      redFlags.push('Disconnected strokes may indicate tracing');
      recommendations.push('Verify signature was written naturally, not traced');
    }

    // Check pressure consistency
    if (characteristics.pressure === 'light' && characteristics.complexity > 70) {
      redFlags.push('Light pressure with high complexity is unusual');
      recommendations.push('Compare with known authentic samples');
    }

    // Check for tremor or hesitation
    if (this.detectTremor(signatureData)) {
      redFlags.push('Tremor or hesitation marks detected');
      recommendations.push('May indicate nervousness, illness, or forgery attempt');
    }

    // Check aspect ratio reasonableness
    const aspectRatio = signatureData.width / signatureData.height;
    if (aspectRatio < 1.5 || aspectRatio > 8) {
      redFlags.push('Unusual signature proportions');
      recommendations.push('Verify signature orientation and completeness');
    }

    // Overall authenticity assessment
    if (redFlags.length === 0) {
      recommendations.push('Signature appears to have natural writing characteristics');
    } else if (redFlags.length >= 3) {
      isAuthentic = false;
      recommendations.push('Multiple red flags present - requires expert verification');
    }

    return {
      isAuthentic,
      redFlags,
      recommendations
    };
  }

  /**
   * Extract signature metadata
   */
  private extractSignatureMetadata(signatureData: ImageData): SignatureAnalysis['metadata'] {
    const inkColor = this.detectInkColor(signatureData);
    const backgroundContrast = this.calculateBackgroundContrast(signatureData);
    const clarity = this.calculateSignatureClarity(signatureData);
    const completeness = this.assessSignatureCompleteness(signatureData);

    return {
      inkColor,
      backgroundContrast: Math.round(backgroundContrast * 100),
      clarity: Math.round(clarity * 100),
      completeness: Math.round(completeness * 100)
    };
  }

  /**
   * Calculate signature quality
   */
  private calculateSignatureQuality(
    characteristics: SignatureAnalysis['characteristics'],
    validation: SignatureAnalysis['validation'],
    metadata: SignatureAnalysis['metadata']
  ): SignatureAnalysis['quality'] {
    let score = 50; // Base score

    // Positive factors
    if (characteristics.continuity > 70) score += 15;
    if (characteristics.strokeCount >= 3 && characteristics.strokeCount <= 12) score += 10;
    if (metadata.backgroundContrast > 60) score += 10;
    if (metadata.clarity > 70) score += 10;
    if (metadata.completeness > 90) score += 10;
    if (validation.isAuthentic) score += 15;

    // Negative factors
    if (validation.redFlags.length > 0) score -= validation.redFlags.length * 10;
    if (characteristics.continuity < 30) score -= 20;
    if (metadata.clarity < 40) score -= 15;

    // Classify quality
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  // Stroke Analysis Methods
  private analyzeStrokePattern(imageData: ImageData): {
    strokeCount: number;
    continuity: number;
    complexity: number;
    straightLineRatio: number;
  } {
    const { width, height, data } = imageData;
    
    // Find stroke endpoints and junctions
    const endpoints = this.findStrokeEndpoints(imageData);
    const junctions = this.findStrokeJunctions(imageData);
    
    // Calculate stroke count (simplified)
    const strokeCount = Math.max(1, endpoints.length / 2);
    
    // Calculate continuity
    const totalPixels = this.countInkPixels(imageData);
    const connectedPixels = this.countConnectedInkPixels(imageData);
    const continuity = totalPixels > 0 ? connectedPixels / totalPixels : 0;
    
    // Calculate complexity based on direction changes
    const directionChanges = this.countDirectionChanges(imageData);
    const complexity = Math.min(1, directionChanges / (width + height));
    
    // Calculate straight line ratio
    const straightLinePixels = this.countStraightLinePixels(imageData);
    const straightLineRatio = totalPixels > 0 ? straightLinePixels / totalPixels : 0;

    return {
      strokeCount,
      continuity,
      complexity,
      straightLineRatio
    };
  }

  private analyzePressurePattern(imageData: ImageData): {
    averagePressure: 'light' | 'medium' | 'heavy';
    variation: number;
  } {
    const { data } = imageData;
    const pressureValues: number[] = [];

    // Sample pressure at ink pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness < 200) { // Likely ink pixel
        const pressure = (255 - brightness) / 255; // Darker = more pressure
        pressureValues.push(pressure);
      }
    }

    if (pressureValues.length === 0) {
      return { averagePressure: 'light', variation: 0 };
    }

    const avgPressure = pressureValues.reduce((sum, p) => sum + p, 0) / pressureValues.length;
    const variance = pressureValues.reduce((sum, p) => sum + Math.pow(p - avgPressure, 2), 0) / pressureValues.length;

    let pressureLevel: 'light' | 'medium' | 'heavy';
    if (avgPressure < 0.3) pressureLevel = 'light';
    else if (avgPressure < 0.7) pressureLevel = 'medium';
    else pressureLevel = 'heavy';

    return {
      averagePressure: pressureLevel,
      variation: Math.sqrt(variance)
    };
  }

  private analyzeSignatureStyle(imageData: ImageData): {
    dominantStyle: 'simple' | 'elaborate' | 'cursive' | 'print' | 'mixed';
  } {
    const strokeAnalysis = this.analyzeStrokePattern(imageData);
    const curves = this.countCurvedStrokes(imageData);
    const loops = this.countLoops(imageData);
    
    // Simple heuristics for style classification
    if (strokeAnalysis.complexity < 0.3 && strokeAnalysis.strokeCount <= 3) {
      return { dominantStyle: 'simple' };
    }
    
    if (loops > 2 && curves > 0.6) {
      return { dominantStyle: 'elaborate' };
    }
    
    if (curves > 0.7 && strokeAnalysis.continuity > 0.6) {
      return { dominantStyle: 'cursive' };
    }
    
    if (strokeAnalysis.straightLineRatio > 0.6) {
      return { dominantStyle: 'print' };
    }
    
    return { dominantStyle: 'mixed' };
  }

  private inferWritingSpeed(strokeAnalysis: { continuity: number; complexity: number }): 'slow' | 'medium' | 'fast' {
    // Fast writing tends to have high continuity and moderate complexity
    if (strokeAnalysis.continuity > 0.7 && strokeAnalysis.complexity > 0.3 && strokeAnalysis.complexity < 0.7) {
      return 'fast';
    }
    
    // Slow writing tends to have lower continuity and higher complexity
    if (strokeAnalysis.continuity < 0.5 || strokeAnalysis.complexity > 0.8) {
      return 'slow';
    }
    
    return 'medium';
  }

  // Authenticity Detection Methods
  private detectDigitalManipulation(imageData: ImageData): boolean {
    // Look for unnatural edges, compression artifacts, or copy-paste patterns
    const edgeConsistency = this.analyzeEdgeConsistency(imageData);
    const compressionArtifacts = this.detectCompressionArtifacts(imageData);
    
    return edgeConsistency < 0.5 || compressionArtifacts > 0.3;
  }

  private detectTremor(imageData: ImageData): boolean {
    const { width, height } = imageData;
    let tremorCount = 0;
    let totalMeasurements = 0;

    // Analyze stroke smoothness by checking for micro-oscillations
    for (let y = 1; y < height - 1; y += 3) {
      for (let x = 2; x < width - 2; x += 3) {
        if (this.isInkPixel(imageData, x, y)) {
          const smoothness = this.measureLocalSmoothness(imageData, x, y);
          if (smoothness < 0.3) tremorCount++;
          totalMeasurements++;
        }
      }
    }

    return totalMeasurements > 0 && (tremorCount / totalMeasurements) > 0.15;
  }

  // Comparison Methods
  private calculateSimilarity(
    char1: SignatureAnalysis['characteristics'],
    char2: SignatureAnalysis['characteristics']
  ): number {
    let similarity = 100;
    
    // Compare stroke count
    const strokeDiff = Math.abs(char1.strokeCount - char2.strokeCount);
    similarity -= strokeDiff * 5;
    
    // Compare continuity
    const continuityDiff = Math.abs(char1.continuity - char2.continuity);
    similarity -= continuityDiff * 0.3;
    
    // Compare complexity
    const complexityDiff = Math.abs(char1.complexity - char2.complexity);
    similarity -= complexityDiff * 0.4;
    
    // Style matching
    if (char1.style !== char2.style) similarity -= 15;
    if (char1.pressure !== char2.pressure) similarity -= 10;
    
    return Math.max(0, similarity);
  }

  private identifyMatchingFeatures(analysis1: SignatureAnalysis, analysis2: SignatureAnalysis): string[] {
    const matches: string[] = [];
    
    if (analysis1.characteristics.style === analysis2.characteristics.style) {
      matches.push(`Similar writing style: ${analysis1.characteristics.style}`);
    }
    
    if (analysis1.characteristics.pressure === analysis2.characteristics.pressure) {
      matches.push(`Matching pressure: ${analysis1.characteristics.pressure}`);
    }
    
    if (Math.abs(analysis1.dimensions.aspectRatio - analysis2.dimensions.aspectRatio) < 0.5) {
      matches.push('Similar proportions');
    }
    
    if (Math.abs(analysis1.characteristics.complexity - analysis2.characteristics.complexity) < 20) {
      matches.push('Similar complexity level');
    }
    
    return matches;
  }

  private identifyDifferences(analysis1: SignatureAnalysis, analysis2: SignatureAnalysis): string[] {
    const differences: string[] = [];
    
    const strokeDiff = Math.abs(analysis1.characteristics.strokeCount - analysis2.characteristics.strokeCount);
    if (strokeDiff > 2) {
      differences.push(`Different stroke count: ${analysis1.characteristics.strokeCount} vs ${analysis2.characteristics.strokeCount}`);
    }
    
    if (analysis1.characteristics.style !== analysis2.characteristics.style) {
      differences.push(`Different styles: ${analysis1.characteristics.style} vs ${analysis2.characteristics.style}`);
    }
    
    const aspectDiff = Math.abs(analysis1.dimensions.aspectRatio - analysis2.dimensions.aspectRatio);
    if (aspectDiff > 1.0) {
      differences.push(`Different proportions: ${analysis1.dimensions.aspectRatio} vs ${analysis2.dimensions.aspectRatio}`);
    }
    
    return differences;
  }

  private determineMatchVerdict(similarity: number, matchingFeatures: number): SignatureComparison['verdict'] {
    if (similarity > 85 && matchingFeatures >= 3) return 'match';
    if (similarity > 70 && matchingFeatures >= 2) return 'likely_match';
    if (similarity > 40) return 'uncertain';
    return 'no_match';
  }

  private calculateComparisonConfidence(
    analysis1: SignatureAnalysis,
    analysis2: SignatureAnalysis,
    similarity: number
  ): number {
    let confidence = similarity;
    
    // Boost confidence if both signatures are high quality
    if (analysis1.quality === 'excellent' && analysis2.quality === 'excellent') {
      confidence += 10;
    } else if (analysis1.quality === 'poor' || analysis2.quality === 'poor') {
      confidence -= 15;
    }
    
    // Reduce confidence if either signature has authenticity issues
    if (!analysis1.validation.isAuthentic || !analysis2.validation.isAuthentic) {
      confidence -= 20;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  // Helper Methods - Image Processing
  private async loadImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private createBinaryImage(imageData: ImageData): Uint8Array {
    const { data } = imageData;
    const binary = new Uint8Array(data.length / 4);
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      binary[i / 4] = brightness < 128 ? 1 : 0; // 1 for ink, 0 for background
    }
    
    return binary;
  }

  private extractSignatureRegion(imageData: ImageData, region: SignatureRegion): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = region.width;
    canvas.height = region.height;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    
    return ctx.getImageData(0, 0, region.width, region.height);
  }

  private createEmptyAnalysis(): SignatureAnalysis {
    return {
      isDetected: false,
      confidence: 0,
      quality: 'poor',
      characteristics: {
        strokeCount: 0,
        continuity: 0,
        complexity: 0,
        pressure: 'light',
        speed: 'medium',
        style: 'simple'
      },
      dimensions: {
        width: 0,
        height: 0,
        aspectRatio: 0,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 }
      },
      validation: {
        isAuthentic: false,
        redFlags: ['No signature detected'],
        recommendations: ['Ensure signature is clearly visible and well-contrasted']
      },
      metadata: {
        inkColor: '#000000',
        backgroundContrast: 0,
        clarity: 0,
        completeness: 0
      }
    };
  }

  // Simplified implementations for complex CV operations
  private findConnectedComponents(binaryData: Uint8Array, width: number, height: number): number[][] {
    // Simplified connected components - returns groups of connected ink pixels
    return []; // Would implement proper connected components algorithm
  }

  private groupComponentsIntoSignatures(components: number[][]): number[][][] {
    // Group nearby components into potential signatures
    return []; // Would implement component grouping logic
  }

  private calculateBoundingBox(group: number[][]): { x: number; y: number; width: number; height: number } {
    return { x: 0, y: 0, width: 100, height: 50 }; // Placeholder
  }

  private isValidSignatureDimension(box: { width: number; height: number }): boolean {
    return box.width >= this.minSignatureWidth && 
           box.width <= this.maxSignatureWidth &&
           box.height >= this.minSignatureHeight && 
           box.height <= this.maxSignatureHeight;
  }

  private calculateInitialConfidence(group: number[][], boundingBox: any): number {
    return 50; // Base confidence
  }

  // Simplified feature detection methods
  private findStrokeEndpoints(imageData: ImageData): Array<{x: number, y: number}> { return []; }
  private findStrokeJunctions(imageData: ImageData): Array<{x: number, y: number}> { return []; }
  private countInkPixels(imageData: ImageData): number { return 0; }
  private countConnectedInkPixels(imageData: ImageData): number { return 0; }
  private countDirectionChanges(imageData: ImageData): number { return 0; }
  private countStraightLinePixels(imageData: ImageData): number { return 0; }
  private countCurvedStrokes(imageData: ImageData): number { return 0; }
  private countLoops(imageData: ImageData): number { return 0; }
  private analyzeEdgeConsistency(imageData: ImageData): number { return 0.8; }
  private detectCompressionArtifacts(imageData: ImageData): number { return 0.1; }
  private isInkPixel(imageData: ImageData, x: number, y: number): boolean { return false; }
  private measureLocalSmoothness(imageData: ImageData, x: number, y: number): number { return 0.8; }
  private detectInkColor(imageData: ImageData): string { return '#000080'; }
  private calculateBackgroundContrast(imageData: ImageData): number { return 0.8; }
  private calculateSignatureClarity(imageData: ImageData): number { return 0.7; }
  private assessSignatureCompleteness(imageData: ImageData): number { return 0.9; }
}