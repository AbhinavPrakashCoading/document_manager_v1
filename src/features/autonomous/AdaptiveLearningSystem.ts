/**
 * Phase 3: Self-Learning Validation System
 * AI-powered adaptive learning from user feedback and success patterns
 */

'use client';

import { Matrix } from 'ml-matrix';
import * as ss from 'simple-statistics';
import { SmartValidationResult } from '../intelligence/SmartValidationEngine';

export interface UserFeedback {
  submissionId: string;
  userId: string;
  documentType: string;
  originalResult: SmartValidationResult;
  userCorrection: {
    actualOutcome: 'accepted' | 'rejected' | 'needs_revision';
    rejectionReasons?: string[];
    userRating: number; // 1-5 stars
    comments?: string;
  };
  timestamp: Date;
  contextData: {
    examType: string;
    userExperience: 'beginner' | 'intermediate' | 'expert';
    deviceType: 'mobile' | 'desktop';
    retryCount: number;
  };
}

export interface ValidationOutcome {
  submissionId: string;
  predicted: SmartValidationResult;
  actual: {
    accepted: boolean;
    rejectionReasons: string[];
    processingTime: number;
  };
  accuracy: {
    overallPrediction: boolean;
    specificPredictions: {
      field: string;
      predicted: boolean;
      actual: boolean;
      accurate: boolean;
    }[];
  };
}

export interface LearningModel {
  modelId: string;
  version: number;
  documentType: string;
  thresholds: {
    blurThreshold: number;
    brightnessThreshold: number;
    contrastThreshold: number;
    faceConfidenceThreshold: number;
    textConfidenceThreshold: number;
  };
  weights: {
    imageQuality: number;
    faceAnalysis: number;
    textAnalysis: number;
    documentClassification: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  trainingData: {
    sampleCount: number;
    lastTraining: Date;
    nextScheduledTraining: Date;
  };
}

export interface PersonalizedProfile {
  userId: string;
  skillLevel: 'beginner' | 'intermediate' | 'expert';
  commonMistakes: string[];
  successPatterns: string[];
  preferredFeedbackStyle: 'detailed' | 'concise' | 'visual';
  devicePreference: 'mobile' | 'desktop';
  adaptations: {
    relaxedThresholds: boolean;
    additionalGuidance: boolean;
    proactiveWarnings: boolean;
  };
  statistics: {
    totalSubmissions: number;
    successRate: number;
    averageRetries: number;
    improvementTrend: number; // -1 to 1
  };
}

export interface AdaptiveThreshold {
  parameter: string;
  baseValue: number;
  adaptedValue: number;
  confidence: number;
  adaptationReason: string;
  effectiveFrom: Date;
  validUntil: Date;
}

export class AdaptiveLearningSystem {
  private models: Map<string, LearningModel> = new Map();
  private userProfiles: Map<string, PersonalizedProfile> = new Map();
  private feedbackBuffer: UserFeedback[] = [];
  private outcomeBuffer: ValidationOutcome[] = [];
  private adaptiveThresholds: Map<string, AdaptiveThreshold[]> = new Map();

  /**
   * Learn from user feedback and adjust validation thresholds
   */
  async learnFromUserFeedback(feedback: UserFeedback[]): Promise<void> {
    // Add feedback to buffer
    this.feedbackBuffer.push(...feedback);
    
    // Update user profiles
    for (const fb of feedback) {
      await this.updateUserProfile(fb);
    }
    
    // Analyze patterns and adapt thresholds
    const patterns = this.analyzeFeedbackPatterns(feedback);
    await this.adaptValidationThresholds(patterns);
    
    // Trigger retraining if buffer is large enough
    if (this.feedbackBuffer.length >= 100) {
      await this.triggerModelRetraining();
    }
  }

  /**
   * Update user profile based on feedback
   */
  private async updateUserProfile(feedback: UserFeedback): Promise<void> {
    const userId = feedback.userId;
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = this.createNewUserProfile(userId, feedback);
    } else {
      profile = this.updateExistingProfile(profile, feedback);
    }
    
    this.userProfiles.set(userId, profile);
  }

  /**
   * Create new user profile
   */
  private createNewUserProfile(userId: string, feedback: UserFeedback): PersonalizedProfile {
    return {
      userId,
      skillLevel: this.inferSkillLevel(feedback),
      commonMistakes: this.extractMistakes(feedback),
      successPatterns: [],
      preferredFeedbackStyle: 'detailed', // Default
      devicePreference: feedback.contextData.deviceType,
      adaptations: {
        relaxedThresholds: false,
        additionalGuidance: true,
        proactiveWarnings: true
      },
      statistics: {
        totalSubmissions: 1,
        successRate: feedback.userCorrection.actualOutcome === 'accepted' ? 100 : 0,
        averageRetries: feedback.contextData.retryCount,
        improvementTrend: 0
      }
    };
  }

  /**
   * Update existing user profile
   */
  private updateExistingProfile(profile: PersonalizedProfile, feedback: UserFeedback): PersonalizedProfile {
    const isSuccess = feedback.userCorrection.actualOutcome === 'accepted';
    const newTotal = profile.statistics.totalSubmissions + 1;
    const newSuccesses = Math.round(profile.statistics.successRate * profile.statistics.totalSubmissions / 100) + (isSuccess ? 1 : 0);
    
    // Update statistics
    profile.statistics.totalSubmissions = newTotal;
    profile.statistics.successRate = (newSuccesses / newTotal) * 100;
    profile.statistics.averageRetries = ((profile.statistics.averageRetries * (newTotal - 1)) + feedback.contextData.retryCount) / newTotal;
    
    // Update skill level based on success rate and retry patterns
    profile.skillLevel = this.updateSkillLevel(profile);
    
    // Update common mistakes
    if (!isSuccess && feedback.userCorrection.rejectionReasons) {
      feedback.userCorrection.rejectionReasons.forEach(reason => {
        if (!profile.commonMistakes.includes(reason)) {
          profile.commonMistakes.push(reason);
        }
      });
    }
    
    // Update adaptations
    profile.adaptations = this.updateAdaptations(profile);
    
    return profile;
  }

  /**
   * Analyze feedback patterns to identify adaptation opportunities
   */
  private analyzeFeedbackPatterns(feedback: UserFeedback[]): {
    documentType: string;
    issue: string;
    frequency: number;
    severity: number;
    suggestedAdjustment: {
      parameter: string;
      currentValue: number;
      suggestedValue: number;
      confidence: number;
    };
  }[] {
    const patterns: any[] = [];
    
    // Group feedback by document type and issue
    const groupedFeedback = this.groupFeedbackByIssue(feedback);
    
    Object.entries(groupedFeedback).forEach(([key, issues]) => {
      const [documentType, issue] = key.split('::');
      const issueCount = issues.length;
      const totalFeedback = feedback.filter(f => f.documentType === documentType).length;
      const frequency = issueCount / totalFeedback;
      
      // Calculate severity based on user ratings
      const avgRating = issues.reduce((sum, f) => sum + f.userCorrection.userRating, 0) / issues.length;
      const severity = (5 - avgRating) / 4; // Convert 1-5 rating to 0-1 severity
      
      // Generate threshold adjustment suggestions
      const adjustment = this.generateThresholdAdjustment(documentType, issue, frequency, severity);
      
      if (adjustment) {
        patterns.push({
          documentType,
          issue,
          frequency,
          severity,
          suggestedAdjustment: adjustment
        });
      }
    });
    
    return patterns;
  }

  /**
   * Group feedback by document type and issue
   */
  private groupFeedbackByIssue(feedback: UserFeedback[]): { [key: string]: UserFeedback[] } {
    const grouped: { [key: string]: UserFeedback[] } = {};
    
    feedback.forEach(fb => {
      if (fb.userCorrection.actualOutcome !== 'accepted' && fb.userCorrection.rejectionReasons) {
        fb.userCorrection.rejectionReasons.forEach(reason => {
          const key = `${fb.documentType}::${reason}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(fb);
        });
      }
    });
    
    return grouped;
  }

  /**
   * Generate threshold adjustment based on issue analysis
   */
  private generateThresholdAdjustment(
    documentType: string,
    issue: string,
    frequency: number,
    severity: number
  ): any {
    // Only suggest adjustments for frequent, severe issues
    if (frequency < 0.1 || severity < 0.3) return null;
    
    const currentModel = this.models.get(documentType);
    if (!currentModel) return null;
    
    // Map issues to threshold parameters
    let parameter: string;
    let currentValue: number;
    let adjustment: number;
    
    if (issue.toLowerCase().includes('blur')) {
      parameter = 'blurThreshold';
      currentValue = currentModel.thresholds.blurThreshold;
      adjustment = -0.1; // Relax blur threshold
    } else if (issue.toLowerCase().includes('brightness')) {
      parameter = 'brightnessThreshold';
      currentValue = currentModel.thresholds.brightnessThreshold;
      adjustment = frequency > 0.2 ? -0.15 : -0.1;
    } else if (issue.toLowerCase().includes('face')) {
      parameter = 'faceConfidenceThreshold';
      currentValue = currentModel.thresholds.faceConfidenceThreshold;
      adjustment = -5; // Reduce face confidence requirement
    } else if (issue.toLowerCase().includes('text')) {
      parameter = 'textConfidenceThreshold';
      currentValue = currentModel.thresholds.textConfidenceThreshold;
      adjustment = -5;
    } else {
      return null;
    }
    
    const suggestedValue = Math.max(0.1, currentValue + adjustment);
    const confidence = Math.min(frequency * severity * 2, 1);
    
    return {
      parameter,
      currentValue,
      suggestedValue,
      confidence
    };
  }

  /**
   * Apply adaptive threshold changes
   */
  private async adaptValidationThresholds(patterns: any[]): Promise<void> {
    for (const pattern of patterns) {
      const { documentType, suggestedAdjustment } = pattern;
      
      if (suggestedAdjustment.confidence > 0.7) {
        const adaptiveThreshold: AdaptiveThreshold = {
          parameter: suggestedAdjustment.parameter,
          baseValue: suggestedAdjustment.currentValue,
          adaptedValue: suggestedAdjustment.suggestedValue,
          confidence: suggestedAdjustment.confidence,
          adaptationReason: `High frequency of ${pattern.issue} issues (${Math.round(pattern.frequency * 100)}%)`,
          effectiveFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
        
        const existingThresholds = this.adaptiveThresholds.get(documentType) || [];
        const updatedThresholds = [...existingThresholds.filter(t => t.parameter !== adaptiveThreshold.parameter), adaptiveThreshold];
        
        this.adaptiveThresholds.set(documentType, updatedThresholds);
        
        // Update the model
        await this.updateModelThresholds(documentType, adaptiveThreshold);
      }
    }
  }

  /**
   * Update model thresholds based on adaptive learning
   */
  private async updateModelThresholds(documentType: string, threshold: AdaptiveThreshold): Promise<void> {
    const model = this.models.get(documentType);
    if (!model) return;
    
    // Apply threshold adjustment
    switch (threshold.parameter) {
      case 'blurThreshold':
        model.thresholds.blurThreshold = threshold.adaptedValue;
        break;
      case 'brightnessThreshold':
        model.thresholds.brightnessThreshold = threshold.adaptedValue;
        break;
      case 'faceConfidenceThreshold':
        model.thresholds.faceConfidenceThreshold = threshold.adaptedValue;
        break;
      case 'textConfidenceThreshold':
        model.thresholds.textConfidenceThreshold = threshold.adaptedValue;
        break;
    }
    
    // Update model version and metadata
    model.version += 1;
    model.trainingData.lastTraining = new Date();
    
    this.models.set(documentType, model);
  }

  /**
   * Improve accuracy based on validation outcomes
   */
  async evolvePredictionModels(outcomes: ValidationOutcome[]): Promise<void> {
    this.outcomeBuffer.push(...outcomes);
    
    // Group outcomes by document type
    const outcomesByType = this.groupOutcomesByDocumentType(outcomes);
    
    // Update model performance metrics
    for (const [documentType, typeOutcomes] of Object.entries(outcomesByType)) {
      await this.updateModelPerformance(documentType, typeOutcomes);
    }
    
    // Retrain models if performance degrades
    await this.checkAndTriggerRetraining();
  }

  /**
   * Group validation outcomes by document type
   */
  private groupOutcomesByDocumentType(outcomes: ValidationOutcome[]): { [type: string]: ValidationOutcome[] } {
    const grouped: { [type: string]: ValidationOutcome[] } = {};
    
    outcomes.forEach(outcome => {
      const docType = outcome.predicted.documentType.detectedType;
      if (!grouped[docType]) {
        grouped[docType] = [];
      }
      grouped[docType].push(outcome);
    });
    
    return grouped;
  }

  /**
   * Update model performance metrics based on outcomes
   */
  private async updateModelPerformance(documentType: string, outcomes: ValidationOutcome[]): Promise<void> {
    const model = this.models.get(documentType);
    if (!model) return;
    
    // Calculate performance metrics
    const accurateCount = outcomes.filter(o => o.accuracy.overallPrediction).length;
    const totalCount = outcomes.length;
    
    // Calculate confusion matrix elements
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    outcomes.forEach(outcome => {
      const predicted = outcome.predicted.overall.status === 'excellent' || outcome.predicted.overall.status === 'good';
      const actual = outcome.actual.accepted;
      
      if (predicted && actual) truePositives++;
      else if (predicted && !actual) falsePositives++;
      else if (!predicted && !actual) trueNegatives++;
      else if (!predicted && actual) falseNegatives++;
    });
    
    // Update performance metrics
    model.performance.accuracy = accurateCount / totalCount;
    model.performance.precision = truePositives / (truePositives + falsePositives) || 0;
    model.performance.recall = truePositives / (truePositives + falseNegatives) || 0;
    model.performance.f1Score = 2 * (model.performance.precision * model.performance.recall) / 
                                (model.performance.precision + model.performance.recall) || 0;
    
    // Update training data info
    model.trainingData.sampleCount += totalCount;
    model.trainingData.lastTraining = new Date();
    
    this.models.set(documentType, model);
  }

  /**
   * Check if retraining is needed and trigger it
   */
  private async checkAndTriggerRetraining(): Promise<void> {
    const modelsNeedingRetraining = Array.from(this.models.entries())
      .filter(([_, model]) => model.performance.accuracy < 0.8 || model.performance.f1Score < 0.75);
    
    for (const [documentType, model] of modelsNeedingRetraining) {
      console.log(`Triggering retraining for ${documentType} model (accuracy: ${model.performance.accuracy.toFixed(2)})`);
      await this.retrainModel(documentType);
    }
  }

  /**
   * Retrain a specific model
   */
  private async retrainModel(documentType: string): Promise<void> {
    const model = this.models.get(documentType);
    if (!model) return;
    
    // Get relevant training data
    const trainingData = this.getTrainingData(documentType);
    
    if (trainingData.length < 50) {
      console.log(`Insufficient training data for ${documentType} (${trainingData.length} samples)`);
      return;
    }
    
    // Perform model retraining (simplified version)
    const newWeights = this.calculateOptimalWeights(trainingData);
    const newThresholds = this.calculateOptimalThresholds(trainingData);
    
    // Update model
    model.weights = newWeights;
    model.thresholds = { ...model.thresholds, ...newThresholds };
    model.version += 1;
    model.trainingData.lastTraining = new Date();
    model.trainingData.nextScheduledTraining = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
    
    this.models.set(documentType, model);
    
    console.log(`Model ${documentType} retrained. New version: ${model.version}`);
  }

  /**
   * Get training data for a document type
   */
  private getTrainingData(documentType: string): ValidationOutcome[] {
    return this.outcomeBuffer.filter(outcome => 
      outcome.predicted.documentType.detectedType === documentType
    );
  }

  /**
   * Calculate optimal weights using simple optimization
   */
  private calculateOptimalWeights(trainingData: ValidationOutcome[]): LearningModel['weights'] {
    // Simplified weight optimization - in practice, would use more sophisticated ML techniques
    const currentWeights = {
      imageQuality: 0.3,
      faceAnalysis: 0.25,
      textAnalysis: 0.25,
      documentClassification: 0.2
    };
    
    // Analyze which components are most predictive
    let imageQualityCorrect = 0;
    let faceAnalysisCorrect = 0;
    let textAnalysisCorrect = 0;
    let docClassificationCorrect = 0;
    
    trainingData.forEach(outcome => {
      const imageGood = outcome.predicted.imageQuality.overall.score > 7;
      const actualAccepted = outcome.actual.accepted;
      
      if (imageGood === actualAccepted) imageQualityCorrect++;
      // Similar analysis for other components...
    });
    
    const total = trainingData.length;
    const imageAccuracy = imageQualityCorrect / total;
    
    // Adjust weights based on component accuracy (simplified)
    return {
      imageQuality: Math.max(0.1, Math.min(0.5, imageAccuracy)),
      faceAnalysis: 0.25,
      textAnalysis: 0.25,
      documentClassification: 0.2
    };
  }

  /**
   * Calculate optimal thresholds using statistical analysis
   */
  private calculateOptimalThresholds(trainingData: ValidationOutcome[]): Partial<LearningModel['thresholds']> {
    // Use ROC analysis to find optimal thresholds
    const imageScores = trainingData.map(d => ({
      score: d.predicted.imageQuality.overall.score,
      actual: d.actual.accepted
    }));
    
    // Find threshold that maximizes F1 score (simplified)
    let bestThreshold = 6;
    let bestF1 = 0;
    
    for (let threshold = 4; threshold <= 9; threshold += 0.5) {
      const predictions = imageScores.map(item => item.score >= threshold);
      const actuals = imageScores.map(item => item.actual);
      
      const f1 = this.calculateF1Score(predictions, actuals);
      if (f1 > bestF1) {
        bestF1 = f1;
        bestThreshold = threshold;
      }
    }
    
    return {
      // Convert back to original threshold scales
      blurThreshold: (bestThreshold - 4) / 5, // Map to 0-1
      brightnessThreshold: (bestThreshold - 4) / 5
    };
  }

  /**
   * Calculate F1 score for binary classification
   */
  private calculateF1Score(predictions: boolean[], actuals: boolean[]): number {
    let tp = 0, fp = 0, fn = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] && actuals[i]) tp++;
      else if (predictions[i] && !actuals[i]) fp++;
      else if (!predictions[i] && actuals[i]) fn++;
    }
    
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    
    return 2 * (precision * recall) / (precision + recall) || 0;
  }

  /**
   * Trigger model retraining when buffer is full
   */
  private async triggerModelRetraining(): Promise<void> {
    console.log('Triggering bulk model retraining...');
    
    // Process all document types
    const documentTypes = new Set([
      ...this.feedbackBuffer.map(f => f.documentType),
      ...this.outcomeBuffer.map(o => o.predicted.documentType.detectedType)
    ]);
    
    for (const docType of documentTypes) {
      await this.retrainModel(docType);
    }
    
    // Clear buffers after processing
    this.feedbackBuffer = [];
    this.outcomeBuffer = this.outcomeBuffer.slice(-1000); // Keep recent 1000 for ongoing learning
  }

  /**
   * Get personalized validation settings for a user
   */
  getPersonalizedSettings(userId: string, documentType: string): {
    thresholds: Partial<LearningModel['thresholds']>;
    weights: Partial<LearningModel['weights']>;
    adaptations: PersonalizedProfile['adaptations'];
  } {
    const profile = this.userProfiles.get(userId);
    const model = this.models.get(documentType);
    const adaptiveThresholds = this.adaptiveThresholds.get(documentType) || [];
    
    let thresholds: Partial<LearningModel['thresholds']> = {};
    let weights: Partial<LearningModel['weights']> = {};
    
    if (model) {
      thresholds = { ...model.thresholds };
      weights = { ...model.weights };
    }
    
    // Apply adaptive thresholds
    adaptiveThresholds
      .filter(t => t.validUntil > new Date())
      .forEach(t => {
        (thresholds as any)[t.parameter] = t.adaptedValue;
      });
    
    // Apply user-specific adaptations
    const adaptations = profile?.adaptations || {
      relaxedThresholds: false,
      additionalGuidance: true,
      proactiveWarnings: true
    };
    
    if (profile?.skillLevel === 'beginner' && adaptations.relaxedThresholds) {
      // Relax thresholds for beginners
      if (thresholds.blurThreshold) thresholds.blurThreshold *= 0.8;
      if (thresholds.brightnessThreshold) thresholds.brightnessThreshold *= 0.8;
      if (thresholds.faceConfidenceThreshold) thresholds.faceConfidenceThreshold *= 0.9;
    }
    
    return { thresholds, weights, adaptations };
  }

  /**
   * Helper methods for user profile management
   */
  private inferSkillLevel(feedback: UserFeedback): 'beginner' | 'intermediate' | 'expert' {
    if (feedback.contextData.retryCount >= 3) return 'beginner';
    if (feedback.userCorrection.userRating >= 4) return 'expert';
    return 'intermediate';
  }

  private extractMistakes(feedback: UserFeedback): string[] {
    return feedback.userCorrection.rejectionReasons || [];
  }

  private updateSkillLevel(profile: PersonalizedProfile): 'beginner' | 'intermediate' | 'expert' {
    if (profile.statistics.successRate >= 90 && profile.statistics.averageRetries <= 1) {
      return 'expert';
    } else if (profile.statistics.successRate >= 70 && profile.statistics.averageRetries <= 2) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private updateAdaptations(profile: PersonalizedProfile): PersonalizedProfile['adaptations'] {
    return {
      relaxedThresholds: profile.skillLevel === 'beginner' && profile.statistics.successRate < 60,
      additionalGuidance: profile.skillLevel !== 'expert',
      proactiveWarnings: profile.commonMistakes.length >= 3
    };
  }

  /**
   * Get learning system statistics
   */
  getSystemStatistics(): {
    modelsCount: number;
    userProfilesCount: number;
    totalFeedback: number;
    totalOutcomes: number;
    averageAccuracy: number;
    recentAdaptations: number;
  } {
    const totalAccuracy = Array.from(this.models.values())
      .reduce((sum, model) => sum + model.performance.accuracy, 0);
    
    const recentAdaptations = Array.from(this.adaptiveThresholds.values())
      .flat()
      .filter(t => t.effectiveFrom > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .length;
    
    return {
      modelsCount: this.models.size,
      userProfilesCount: this.userProfiles.size,
      totalFeedback: this.feedbackBuffer.length,
      totalOutcomes: this.outcomeBuffer.length,
      averageAccuracy: this.models.size > 0 ? totalAccuracy / this.models.size : 0,
      recentAdaptations
    };
  }
}