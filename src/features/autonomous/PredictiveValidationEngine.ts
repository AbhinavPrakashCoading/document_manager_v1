/**
 * Phase 3: Predictive Intelligence System
 * Advanced analytics for submission success probability and proactive issue prevention
 */

'use client';

import { Matrix } from 'ml-matrix';
import * as brain from 'brain.js';
import * as ss from 'simple-statistics';
import { SmartValidationResult } from '../intelligence/SmartValidationEngine';
import { AdaptiveLearningSystem, ValidationOutcome, UserFeedback } from './AdaptiveLearningSystem';

export interface PredictionResult {
  submissionId: string;
  successProbability: number; // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  likelyIssues: PredictedIssue[];
  recommendations: ActionableRecommendation[];
  confidenceLevel: number; // 0-100%
  predictedProcessingTime: number; // minutes
  alternativeStrategies: string[];
  historicalComparison: {
    similarSubmissions: number;
    averageSuccessRate: number;
    commonFailurePoints: string[];
  };
}

export interface PredictedIssue {
  type: string;
  description: string;
  probability: number; // 0-100%
  severity: 'low' | 'medium' | 'high' | 'critical';
  preventable: boolean;
  suggestedFix: string;
  estimatedImpact: string;
}

export interface ActionableRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  expectedImprovement: number; // Expected improvement in success probability
  difficulty: 'easy' | 'moderate' | 'difficult';
  timeToImplement: string;
}

export interface PersonalizedTips {
  userId: string;
  skillLevel: 'beginner' | 'intermediate' | 'expert';
  personalizedAdvice: string[];
  strongPoints: string[];
  improvementAreas: string[];
  nextBestActions: string[];
  successPrediction: {
    nextSubmissionProbability: number;
    timeToExpertLevel: string;
    milestones: string[];
  };
}

export interface SubmissionPattern {
  documentType: string;
  timeOfDay: number; // hour 0-23
  dayOfWeek: number; // 0-6
  deviceType: 'mobile' | 'desktop';
  retryCount: number;
  userExperience: 'beginner' | 'intermediate' | 'expert';
  imageQualityScore: number;
  documentComplexity: 'simple' | 'moderate' | 'complex';
  seasonality: string; // e.g., 'exam_season', 'regular'
}

export interface PredictiveModel {
  modelId: string;
  modelType: 'neural_network' | 'linear_regression' | 'decision_tree' | 'ensemble';
  documentType: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastTrained: Date;
  inputFeatures: string[];
  weights: number[];
  neuralNetwork?: brain.NeuralNetwork;
}

export interface RealTimeAlert {
  alertId: string;
  userId: string;
  alertType: 'prediction_warning' | 'quality_alert' | 'deadline_reminder' | 'optimization_tip';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  actionRequired: boolean;
  suggestedActions: string[];
  triggerCondition: string;
  timestamp: Date;
  dismissed: boolean;
}

export class PredictiveValidationEngine {
  private models: Map<string, PredictiveModel> = new Map();
  private submissionPatterns: SubmissionPattern[] = [];
  private historicalOutcomes: ValidationOutcome[] = [];
  private userFeedback: UserFeedback[] = [];
  private learningSystem: AdaptiveLearningSystem;
  private alertSystem: Map<string, RealTimeAlert[]> = new Map();

  constructor(learningSystem: AdaptiveLearningSystem) {
    this.learningSystem = learningSystem;
    this.initializePredictiveModels();
  }

  /**
   * Initialize predictive models for different document types
   */
  private initializePredictiveModels(): void {
    const documentTypes = ['passport_photo', 'signature', 'id_card', 'certificate', 'document'];
    
    documentTypes.forEach(docType => {
      // Initialize neural network for complex predictions
      const neuralNetwork = new brain.NeuralNetwork({
        hiddenLayers: [10, 8, 6],
        activation: 'sigmoid',
        learningRate: 0.3
      });
      
      const model: PredictiveModel = {
        modelId: `prediction_${docType}_${Date.now()}`,
        modelType: 'neural_network',
        documentType: docType,
        accuracy: 0.75, // Initial accuracy
        precision: 0.75,
        recall: 0.75,
        f1Score: 0.75,
        trainingDataSize: 0,
        lastTrained: new Date(),
        inputFeatures: [
          'imageQualityScore',
          'faceConfidence',
          'textConfidence',
          'documentClassificationConfidence',
          'userExperienceLevel',
          'retryCount',
          'timeOfDay',
          'dayOfWeek',
          'deviceType'
        ],
        weights: [],
        neuralNetwork
      };
      
      this.models.set(docType, model);
    });
  }

  /**
   * Predict submission success probability with detailed analysis
   */
  async predictSubmissionSuccess(
    documents: File[],
    validationResult: SmartValidationResult,
    userContext?: {
      userId: string;
      experienceLevel: string;
      deviceType: string;
      retryCount: number;
    }
  ): Promise<PredictionResult> {
    
    const submissionId = `pred_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const documentType = validationResult.documentType.detectedType;
    const model = this.models.get(documentType);
    
    if (!model) {
      throw new Error(`No predictive model available for document type: ${documentType}`);
    }

    // Extract features for prediction
    const features = this.extractPredictionFeatures(validationResult, userContext);
    
    // Run prediction through neural network
    const neuralPrediction = await this.runNeuralPrediction(model, features);
    
    // Analyze potential issues
    const likelyIssues = await this.predictLikelyIssues(validationResult, features);
    
    // Generate actionable recommendations
    const recommendations = await this.generateRecommendations(validationResult, likelyIssues, features);
    
    // Calculate confidence level
    const confidenceLevel = this.calculatePredictionConfidence(model, features);
    
    // Estimate processing time
    const predictedProcessingTime = this.predictProcessingTime(validationResult, features);
    
    // Get historical comparison
    const historicalComparison = this.getHistoricalComparison(documentType, features);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(neuralPrediction, likelyIssues);
    
    // Generate alternative strategies
    const alternativeStrategies = this.generateAlternativeStrategies(validationResult, likelyIssues);

    const predictionResult: PredictionResult = {
      submissionId,
      successProbability: Math.round(neuralPrediction * 100),
      riskLevel,
      likelyIssues,
      recommendations,
      confidenceLevel,
      predictedProcessingTime,
      alternativeStrategies,
      historicalComparison
    };

    // Generate real-time alerts if needed
    await this.generateRealTimeAlerts(predictionResult, userContext);

    return predictionResult;
  }

  /**
   * Extract features for prediction model
   */
  private extractPredictionFeatures(
    validationResult: SmartValidationResult,
    userContext?: any
  ): number[] {
    const now = new Date();
    
    const features = [
      validationResult.overall.confidence / 100, // 0-1
      validationResult.contentAnalysis.face?.primaryFace?.qualityScore || 0.5, // 0-1
      (validationResult.contentAnalysis.text?.confidence || 50) / 100, // 0-1
      validationResult.documentType.confidence / 100, // 0-1
      this.encodeExperienceLevel(userContext?.experienceLevel), // 0-1
      Math.min((userContext?.retryCount || 0) / 5, 1), // 0-1, normalized
      now.getHours() / 24, // 0-1
      now.getDay() / 7, // 0-1
      userContext?.deviceType === 'mobile' ? 1 : 0 // 0 or 1
    ];
    
    return features;
  }

  /**
   * Run prediction through neural network
   */
  private async runNeuralPrediction(model: PredictiveModel, features: number[]): Promise<number> {
    if (!model.neuralNetwork) {
      throw new Error('Neural network not initialized');
    }

    try {
      // Convert features to neural network input format
      const input: { [key: string]: number } = {};
      model.inputFeatures.forEach((feature, index) => {
        input[feature] = features[index] || 0;
      });

      const output = model.neuralNetwork.run(input) as number;
      
      // Clamp output between 0 and 1
      return Math.max(0, Math.min(1, output));
    } catch (error) {
      console.warn('Neural network prediction failed, using fallback', error);
      return this.fallbackPrediction(features);
    }
  }

  /**
   * Fallback prediction using simple weighted average
   */
  private fallbackPrediction(features: number[]): number {
    const weights = [0.3, 0.25, 0.2, 0.15, 0.05, -0.1, 0.05, 0.0, -0.05];
    
    let prediction = 0.5; // Base prediction
    features.forEach((feature, index) => {
      if (weights[index]) {
        prediction += feature * weights[index];
      }
    });
    
    return Math.max(0, Math.min(1, prediction));
  }

  /**
   * Predict likely issues based on validation result
   */
  private async predictLikelyIssues(
    validationResult: SmartValidationResult,
    features: number[]
  ): Promise<PredictedIssue[]> {
    const issues: PredictedIssue[] = [];

    // Image quality issues
    if (validationResult.overall.confidence < 70) {
      issues.push({
        type: 'image_quality',
        description: 'Image quality may not meet requirements',
        probability: 85,
        severity: 'high',
        preventable: true,
        suggestedFix: 'Retake photo with better lighting and focus',
        estimatedImpact: 'May cause rejection or delay processing'
      });
    }

    // Document classification issues
    if (validationResult.documentType.confidence < 60) {
      issues.push({
        type: 'document_classification',
        description: 'Document type detection is uncertain',
        probability: 70,
        severity: 'medium',
        preventable: true,
        suggestedFix: 'Ensure document is clearly visible and properly oriented',
        estimatedImpact: 'May require manual review'
      });
    }

    // Compliance issues
    if (!validationResult.compliance.isCompliant) {
      const unmetRequirements = validationResult.compliance.requirements.filter(
        req => req.status === 'not_met'
      );
      
      unmetRequirements.forEach(req => {
        issues.push({
          type: 'compliance',
          description: `${req.name} requirement not met`,
          probability: 95,
          severity: 'critical',
          preventable: true,
          suggestedFix: req.details,
          estimatedImpact: 'Will likely cause rejection'
        });
      });
    }

    // User experience-based predictions
    const retryCount = features[5] * 5; // Denormalize retry count
    if (retryCount >= 3) {
      issues.push({
        type: 'user_pattern',
        description: 'High retry count indicates recurring issues',
        probability: 60,
        severity: 'medium',
        preventable: true,
        suggestedFix: 'Review common mistakes and follow detailed guidelines',
        estimatedImpact: 'May indicate fundamental document quality issues'
      });
    }

    // Time-based predictions
    const timeOfDay = features[6] * 24; // Denormalize hour
    if (timeOfDay < 9 || timeOfDay > 17) {
      issues.push({
        type: 'timing',
        description: 'Submission outside business hours may delay processing',
        probability: 40,
        severity: 'low',
        preventable: true,
        suggestedFix: 'Consider submitting during business hours (9 AM - 5 PM)',
        estimatedImpact: 'May result in delayed processing'
      });
    }

    return issues;
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    validationResult: SmartValidationResult,
    likelyIssues: PredictedIssue[],
    features: number[]
  ): Promise<ActionableRecommendation[]> {
    const recommendations: ActionableRecommendation[] = [];

    // High-priority issues first
    const criticalIssues = likelyIssues.filter(issue => issue.severity === 'critical');
    criticalIssues.forEach(issue => {
      recommendations.push({
        priority: 'immediate',
        action: issue.suggestedFix,
        reason: issue.description,
        expectedImprovement: 25,
        difficulty: 'easy',
        timeToImplement: '5 minutes'
      });
    });

    // General quality improvements
    if (validationResult.overall.confidence < 80) {
      recommendations.push({
        priority: 'high',
        action: 'Improve overall document quality',
        reason: 'Current quality score is below optimal threshold',
        expectedImprovement: 15,
        difficulty: 'moderate',
        timeToImplement: '10 minutes'
      });
    }

    // User experience improvements
    const userExperience = this.decodeExperienceLevel(features[4]);
    if (userExperience === 'beginner') {
      recommendations.push({
        priority: 'medium',
        action: 'Review documentation guidelines thoroughly',
        reason: 'First-time users benefit from detailed preparation',
        expectedImprovement: 20,
        difficulty: 'easy',
        timeToImplement: '15 minutes'
      });
    }

    // Device-specific recommendations
    const isMobile = features[8] === 1;
    if (isMobile) {
      recommendations.push({
        priority: 'medium',
        action: 'Use desktop for better photo capture quality',
        reason: 'Desktop typically provides better image quality',
        expectedImprovement: 10,
        difficulty: 'easy',
        timeToImplement: 'Next submission'
      });
    }

    // Sort by priority and expected improvement
    return recommendations.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.expectedImprovement - a.expectedImprovement;
    });
  }

  /**
   * Calculate prediction confidence level
   */
  private calculatePredictionConfidence(model: PredictiveModel, features: number[]): number {
    let confidence = model.accuracy * 100; // Base confidence from model accuracy
    
    // Adjust based on feature quality
    const featureQuality = features.reduce((sum, feature) => sum + (feature >= 0 ? 1 : 0), 0) / features.length;
    confidence *= featureQuality;
    
    // Adjust based on training data size
    const dataConfidenceMultiplier = Math.min(model.trainingDataSize / 1000, 1);
    confidence *= (0.7 + 0.3 * dataConfidenceMultiplier);
    
    return Math.round(Math.max(50, Math.min(95, confidence)));
  }

  /**
   * Predict processing time based on historical data and current conditions
   */
  private predictProcessingTime(validationResult: SmartValidationResult, features: number[]): number {
    let baseTime = 15; // 15 minutes base processing time
    
    // Adjust based on document complexity
    if (validationResult.documentType.detectedType === 'passport_photo') {
      baseTime = 10;
    } else if (validationResult.documentType.detectedType === 'signature') {
      baseTime = 8;
    } else if (validationResult.documentType.detectedType === 'certificate') {
      baseTime = 20;
    }
    
    // Adjust based on quality - lower quality takes longer
    const qualityMultiplier = 1 + (1 - (validationResult.overall.confidence / 100));
    baseTime *= qualityMultiplier;
    
    // Adjust based on time of day
    const timeOfDay = features[6] * 24;
    if (timeOfDay < 9 || timeOfDay > 17) {
      baseTime *= 1.5; // 50% longer outside business hours
    }
    
    // Adjust based on compliance issues
    const complianceIssues = validationResult.compliance.requirements.filter(
      req => req.status === 'not_met'
    ).length;
    baseTime += complianceIssues * 5; // 5 minutes per issue
    
    return Math.round(baseTime);
  }

  /**
   * Get historical comparison data
   */
  private getHistoricalComparison(documentType: string, features: number[]): PredictionResult['historicalComparison'] {
    const similarSubmissions = this.historicalOutcomes.filter(outcome => {
      return outcome.predicted.documentType.detectedType === documentType;
    });
    
    const successfulSubmissions = similarSubmissions.filter(outcome => outcome.actual.accepted);
    const averageSuccessRate = similarSubmissions.length > 0 
      ? (successfulSubmissions.length / similarSubmissions.length) * 100 
      : 75; // Default if no historical data
    
    // Extract common failure points
    const rejectedSubmissions = similarSubmissions.filter(outcome => !outcome.actual.accepted);
    const failureReasons = rejectedSubmissions.map(outcome => outcome.actual.rejectionReasons).flat();
    const reasonCounts = failureReasons.reduce((counts, reason) => {
      counts[reason] = (counts[reason] || 0) + 1;
      return counts;
    }, {} as { [reason: string]: number });
    
    const commonFailurePoints = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);

    return {
      similarSubmissions: similarSubmissions.length,
      averageSuccessRate: Math.round(averageSuccessRate),
      commonFailurePoints
    };
  }

  /**
   * Determine risk level based on prediction and issues
   */
  private determineRiskLevel(successProbability: number, issues: PredictedIssue[]): PredictionResult['riskLevel'] {
    const probability = successProbability * 100;
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;
    
    if (probability < 30 || criticalIssues >= 2) {
      return 'critical';
    } else if (probability < 60 || criticalIssues >= 1 || highIssues >= 2) {
      return 'high';
    } else if (probability < 80 || highIssues >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate alternative strategies for improvement
   */
  private generateAlternativeStrategies(
    validationResult: SmartValidationResult,
    issues: PredictedIssue[]
  ): string[] {
    const strategies: string[] = [];
    
    if (issues.some(issue => issue.type === 'image_quality')) {
      strategies.push('Try using a professional photo studio for high-quality images');
      strategies.push('Use natural daylight for better lighting conditions');
      strategies.push('Consider using a tripod or stable surface for sharper images');
    }
    
    if (issues.some(issue => issue.type === 'compliance')) {
      strategies.push('Review official guidelines document thoroughly before next attempt');
      strategies.push('Consult with someone who has successfully submitted similar documents');
      strategies.push('Contact support for specific clarification on requirements');
    }
    
    if (validationResult.documentType.confidence < 70) {
      strategies.push('Ensure document is properly cropped to show only relevant content');
      strategies.push('Use a contrasting background to make document stand out');
      strategies.push('Try submitting one document type at a time for better classification');
    }
    
    // General strategies
    strategies.push('Submit during peak hours (10 AM - 4 PM) for faster processing');
    strategies.push('Keep original documents as backup in case resubmission is needed');
    
    return strategies;
  }

  /**
   * Generate personalized guidance based on user history
   */
  async generatePersonalizedGuidance(userHistory: UserFeedback[]): Promise<PersonalizedTips> {
    if (userHistory.length === 0) {
      throw new Error('No user history available for personalized guidance');
    }

    const userId = userHistory[0].userId;
    const successfulSubmissions = userHistory.filter(fb => fb.userCorrection.actualOutcome === 'accepted');
    const failedSubmissions = userHistory.filter(fb => fb.userCorrection.actualOutcome === 'rejected');
    
    // Determine skill level
    const successRate = successfulSubmissions.length / userHistory.length;
    const averageRetries = userHistory.reduce((sum, fb) => sum + fb.contextData.retryCount, 0) / userHistory.length;
    
    let skillLevel: 'beginner' | 'intermediate' | 'expert';
    if (successRate >= 0.9 && averageRetries <= 1) {
      skillLevel = 'expert';
    } else if (successRate >= 0.7 && averageRetries <= 2) {
      skillLevel = 'intermediate';
    } else {
      skillLevel = 'beginner';
    }

    // Extract common mistakes
    const allMistakes = failedSubmissions
      .map(fb => fb.userCorrection.rejectionReasons || [])
      .flat();
    const mistakeCounts = allMistakes.reduce((counts, mistake) => {
      counts[mistake] = (counts[mistake] || 0) + 1;
      return counts;
    }, {} as { [mistake: string]: number });
    
    const commonMistakes = Object.entries(mistakeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mistake]) => mistake);

    // Identify strong points
    const strongPoints: string[] = [];
    if (successfulSubmissions.length > 0) {
      const avgRating = successfulSubmissions.reduce((sum, fb) => sum + fb.userCorrection.userRating, 0) / successfulSubmissions.length;
      if (avgRating >= 4) {
        strongPoints.push('Consistently high-quality submissions');
      }
      
      const quickSubmitters = successfulSubmissions.filter(fb => fb.contextData.retryCount === 1);
      if (quickSubmitters.length / successfulSubmissions.length >= 0.8) {
        strongPoints.push('Gets it right on the first try');
      }
    }

    // Generate personalized advice
    const personalizedAdvice: string[] = [];
    
    if (skillLevel === 'beginner') {
      personalizedAdvice.push('Take time to read all requirements carefully before starting');
      personalizedAdvice.push('Use the built-in quality checker before final submission');
      personalizedAdvice.push('Consider submitting during less busy hours for faster feedback');
    } else if (skillLevel === 'intermediate') {
      personalizedAdvice.push('Focus on consistency - you\'re doing well overall');
      personalizedAdvice.push('Pay attention to the specific issues that have caused problems before');
    } else {
      personalizedAdvice.push('Your submission quality is excellent - keep it up!');
      personalizedAdvice.push('Consider helping others with your expertise');
    }

    // Add mistake-specific advice
    commonMistakes.forEach(mistake => {
      if (mistake.toLowerCase().includes('blur')) {
        personalizedAdvice.push('Use a tripod or steady surface to avoid blur');
      } else if (mistake.toLowerCase().includes('background')) {
        personalizedAdvice.push('Pay special attention to background uniformity');
      } else if (mistake.toLowerCase().includes('lighting')) {
        personalizedAdvice.push('Try taking photos near a window with natural light');
      }
    });

    // Calculate improvement areas
    const improvementAreas = commonMistakes.map(mistake => 
      `Reduce ${mistake.toLowerCase()} issues`
    );

    // Next best actions
    const nextBestActions: string[] = [];
    if (skillLevel === 'beginner') {
      nextBestActions.push('Complete practice submissions to build confidence');
      nextBestActions.push('Focus on one document type at a time');
    } else {
      nextBestActions.push('Maintain current quality standards');
      nextBestActions.push('Experiment with different lighting setups for optimal results');
    }

    // Success prediction
    const recentTrend = this.calculateImprovementTrend(userHistory);
    const nextSubmissionProbability = Math.min(95, successRate * 100 + recentTrend * 10);
    
    const timeToExpertLevel = skillLevel === 'expert' ? 'Already achieved!' : 
      skillLevel === 'intermediate' ? '2-3 successful submissions' : '5-10 successful submissions';

    const milestones = this.generateMilestones(skillLevel, successRate);

    return {
      userId,
      skillLevel,
      personalizedAdvice,
      strongPoints,
      improvementAreas,
      nextBestActions,
      successPrediction: {
        nextSubmissionProbability: Math.round(nextSubmissionProbability),
        timeToExpertLevel,
        milestones
      }
    };
  }

  /**
   * Calculate improvement trend from user history
   */
  private calculateImprovementTrend(userHistory: UserFeedback[]): number {
    if (userHistory.length < 3) return 0;
    
    const sortedHistory = userHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recent = sortedHistory.slice(-3);
    const older = sortedHistory.slice(-6, -3);
    
    if (older.length === 0) return 0;
    
    const recentSuccess = recent.filter(fb => fb.userCorrection.actualOutcome === 'accepted').length / recent.length;
    const olderSuccess = older.filter(fb => fb.userCorrection.actualOutcome === 'accepted').length / older.length;
    
    return recentSuccess - olderSuccess; // Positive means improving
  }

  /**
   * Generate milestones for user progression
   */
  private generateMilestones(skillLevel: string, successRate: number): string[] {
    const milestones: string[] = [];
    
    if (skillLevel === 'beginner') {
      milestones.push('Achieve 3 consecutive successful submissions');
      milestones.push('Reach 70% overall success rate');
      milestones.push('Submit without needing retries');
    } else if (skillLevel === 'intermediate') {
      milestones.push('Achieve 90% success rate');
      milestones.push('Help 5 other users with advice');
      milestones.push('Master advanced document types');
    } else {
      milestones.push('Maintain 95%+ success rate');
      milestones.push('Become a community expert');
      milestones.push('Contribute to system improvements');
    }
    
    return milestones;
  }

  /**
   * Generate real-time alerts based on predictions
   */
  private async generateRealTimeAlerts(
    prediction: PredictionResult,
    userContext?: { userId: string }
  ): Promise<void> {
    if (!userContext?.userId) return;
    
    const alerts: RealTimeAlert[] = [];
    
    // Critical risk alert
    if (prediction.riskLevel === 'critical') {
      alerts.push({
        alertId: `critical_${Date.now()}`,
        userId: userContext.userId,
        alertType: 'prediction_warning',
        severity: 'critical',
        message: `High risk of rejection detected (${prediction.successProbability}% success probability)`,
        actionRequired: true,
        suggestedActions: prediction.recommendations.slice(0, 2).map(rec => rec.action),
        triggerCondition: 'Critical risk level detected',
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    // Quality alerts
    prediction.likelyIssues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        alerts.push({
          alertId: `quality_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: userContext.userId,
          alertType: 'quality_alert',
          severity: issue.severity === 'critical' ? 'error' : 'warning',
          message: issue.description,
          actionRequired: issue.preventable,
          suggestedActions: [issue.suggestedFix],
          triggerCondition: `${issue.type} issue detected`,
          timestamp: new Date(),
          dismissed: false
        });
      }
    });
    
    // Store alerts
    const existingAlerts = this.alertSystem.get(userContext.userId) || [];
    this.alertSystem.set(userContext.userId, [...existingAlerts, ...alerts]);
  }

  /**
   * Train predictive models with new data
   */
  async trainModels(outcomes: ValidationOutcome[]): Promise<void> {
    const outcomesByType = this.groupOutcomesByDocumentType(outcomes);
    
    for (const [documentType, typeOutcomes] of Object.entries(outcomesByType)) {
      const model = this.models.get(documentType);
      if (!model || typeOutcomes.length < 10) continue; // Need minimum data
      
      // Prepare training data
      const trainingData = typeOutcomes.map(outcome => {
        const features = this.extractPredictionFeatures(outcome.predicted);
        const target = outcome.actual.accepted ? 1 : 0;
        
        const input: { [key: string]: number } = {};
        model.inputFeatures.forEach((feature, index) => {
          input[feature] = features[index] || 0;
        });
        
        return { input, output: { success: target } };
      });
      
      // Train neural network
      if (model.neuralNetwork) {
        model.neuralNetwork.train(trainingData, {
          iterations: 1000,
          errorThresh: 0.005,
          logPeriod: 100
        });
        
        // Update model metadata
        model.trainingDataSize += trainingData.length;
        model.lastTrained = new Date();
        
        // Calculate new accuracy
        const predictions = trainingData.map(data => {
          const prediction = model.neuralNetwork!.run(data.input) as { success: number };
          return prediction.success > 0.5;
        });
        const actuals = trainingData.map(data => data.output.success === 1);
        
        model.accuracy = this.calculateAccuracy(predictions, actuals);
        model.precision = this.calculatePrecision(predictions, actuals);
        model.recall = this.calculateRecall(predictions, actuals);
        model.f1Score = 2 * (model.precision * model.recall) / (model.precision + model.recall) || 0;
        
        console.log(`Model ${documentType} retrained: Accuracy ${(model.accuracy * 100).toFixed(1)}%, F1 ${(model.f1Score * 100).toFixed(1)}%`);
      }
    }
  }

  // Helper methods
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

  private encodeExperienceLevel(level?: string): number {
    switch (level) {
      case 'expert': return 1;
      case 'intermediate': return 0.5;
      case 'beginner': return 0;
      default: return 0.5;
    }
  }

  private decodeExperienceLevel(encoded: number): string {
    if (encoded >= 0.8) return 'expert';
    if (encoded >= 0.3) return 'intermediate';
    return 'beginner';
  }

  private calculateAccuracy(predictions: boolean[], actuals: boolean[]): number {
    const correct = predictions.filter((pred, i) => pred === actuals[i]).length;
    return correct / predictions.length;
  }

  private calculatePrecision(predictions: boolean[], actuals: boolean[]): number {
    const truePositives = predictions.filter((pred, i) => pred && actuals[i]).length;
    const falsePositives = predictions.filter((pred, i) => pred && !actuals[i]).length;
    return truePositives / (truePositives + falsePositives) || 0;
  }

  private calculateRecall(predictions: boolean[], actuals: boolean[]): number {
    const truePositives = predictions.filter((pred, i) => pred && actuals[i]).length;
    const falseNegatives = predictions.filter((pred, i) => !pred && actuals[i]).length;
    return truePositives / (truePositives + falseNegatives) || 0;
  }

  /**
   * Get user alerts
   */
  getUserAlerts(userId: string): RealTimeAlert[] {
    return this.alertSystem.get(userId) || [];
  }

  /**
   * Dismiss alert
   */
  dismissAlert(userId: string, alertId: string): boolean {
    const alerts = this.alertSystem.get(userId);
    if (alerts) {
      const alert = alerts.find(a => a.alertId === alertId);
      if (alert) {
        alert.dismissed = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Get prediction statistics
   */
  getPredictionStatistics(): {
    totalModels: number;
    averageAccuracy: number;
    totalPredictions: number;
    activeAlerts: number;
    recentTraining: Date | null;
  } {
    const models = Array.from(this.models.values());
    const allAlerts = Array.from(this.alertSystem.values()).flat();
    
    return {
      totalModels: models.length,
      averageAccuracy: models.length > 0 
        ? models.reduce((sum, model) => sum + model.accuracy, 0) / models.length
        : 0,
      totalPredictions: this.historicalOutcomes.length,
      activeAlerts: allAlerts.filter(alert => !alert.dismissed).length,
      recentTraining: models.length > 0 
        ? new Date(Math.max(...models.map(model => model.lastTrained.getTime())))
        : null
    };
  }
}