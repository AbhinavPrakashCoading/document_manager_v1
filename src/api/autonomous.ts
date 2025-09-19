/**
 * API endpoints for Phase 3 Autonomous Intelligence System
 * Provides REST API access to all autonomous capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutonomousEngine } from '@/features/autonomous/AutonomousEngine';
import { PredictiveValidationEngine } from '@/features/autonomous/PredictiveValidationEngine';
import { AdaptiveLearningSystem } from '@/features/autonomous/AdaptiveLearningSystem';
import { SchemaDiscoveryEngine } from '@/features/autonomous/SchemaDiscoveryEngine';
import { VisualWebScraper } from '@/features/autonomous/VisualWebScraper';
import { SmartValidationEngine } from '@/features/intelligence/SmartValidationEngine';

// Global autonomous engine instance (in production, this would be properly managed)
let autonomousEngineInstance: AutonomousEngine | null = null;

/**
 * Get or create the autonomous engine instance
 */
function getAutonomousEngine(): AutonomousEngine {
  if (!autonomousEngineInstance) {
    autonomousEngineInstance = new AutonomousEngine({
      enableAutomaticDiscovery: true,
      enableAdaptiveLearning: true,
      enablePredictiveAnalytics: true,
      enableSchemaEvolution: true,
      discoveryInterval: 30,
      learningThreshold: 10,
      predictionConfidenceThreshold: 70,
      maxConcurrentDiscoveries: 3,
      alertingSeverity: 'warning'
    });
  }
  return autonomousEngineInstance;
}

/**
 * Handle errors in API endpoints
 */
function handleApiError(error: any, context: string): NextResponse {
  console.error(`API Error in ${context}:`, error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      context,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
}

/**
 * Validate required fields in request body
 */
function validateRequiredFields(body: any, requiredFields: string[]): string | null {
  const missingFields = requiredFields.filter(field => !body[field]);
  return missingFields.length > 0 
    ? `Missing required fields: ${missingFields.join(', ')}`
    : null;
}

// ============================================================================
// AUTONOMOUS ENGINE MANAGEMENT
// ============================================================================

/**
 * POST /api/autonomous/engine/start
 * Start the autonomous engine
 */
export async function startAutonomousEngine(request: NextRequest): Promise<NextResponse> {
  try {
    const engine = getAutonomousEngine();
    
    if (engine.isOperational()) {
      return NextResponse.json({
        success: false,
        message: 'Autonomous engine is already running',
        status: 'running'
      }, { status: 400 });
    }

    await engine.startAutonomousOperation();
    
    return NextResponse.json({
      success: true,
      message: 'Autonomous engine started successfully',
      status: 'running',
      configuration: engine.getConfiguration(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, 'start_autonomous_engine');
  }
}

/**
 * POST /api/autonomous/engine/stop
 * Stop the autonomous engine
 */
export async function stopAutonomousEngine(request: NextRequest): Promise<NextResponse> {
  try {
    const engine = getAutonomousEngine();
    
    if (!engine.isOperational()) {
      return NextResponse.json({
        success: false,
        message: 'Autonomous engine is not running',
        status: 'stopped'
      }, { status: 400 });
    }

    await engine.stopAutonomousOperation();
    
    return NextResponse.json({
      success: true,
      message: 'Autonomous engine stopped successfully',
      status: 'stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, 'stop_autonomous_engine');
  }
}

/**
 * GET /api/autonomous/engine/status
 * Get autonomous engine status and metrics
 */
export async function getAutonomousStatus(request: NextRequest): Promise<NextResponse> {
  try {
    const engine = getAutonomousEngine();
    
    const status = {
      isOperational: engine.isOperational(),
      configuration: engine.getConfiguration(),
      metrics: engine.getSystemMetrics(),
      operationStatuses: engine.getOperationStatuses(),
      activeWorkflows: engine.getActiveWorkflows(),
      insights: engine.getSystemInsights().slice(0, 10), // Last 10 insights
      recentErrors: engine.getRecentErrors().slice(0, 5), // Last 5 errors
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    return handleApiError(error, 'get_autonomous_status');
  }
}

/**
 * PUT /api/autonomous/engine/config
 * Update autonomous engine configuration
 */
export async function updateAutonomousConfig(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const engine = getAutonomousEngine();
    
    // Validate configuration fields
    const validFields = [
      'enableAutomaticDiscovery',
      'enableAdaptiveLearning', 
      'enablePredictiveAnalytics',
      'enableSchemaEvolution',
      'discoveryInterval',
      'learningThreshold',
      'predictionConfidenceThreshold',
      'maxConcurrentDiscoveries',
      'alertingSeverity'
    ];
    
    const config = Object.keys(body)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);
    
    if (Object.keys(config).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid configuration fields provided',
        validFields
      }, { status: 400 });
    }
    
    engine.updateConfiguration(config);
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      updatedFields: Object.keys(config),
      newConfiguration: engine.getConfiguration()
    });

  } catch (error) {
    return handleApiError(error, 'update_autonomous_config');
  }
}

// ============================================================================
// PREDICTIVE VALIDATION
// ============================================================================

/**
 * POST /api/autonomous/predict
 * Predict submission success with full autonomous intelligence
 */
export async function predictSubmissionSuccess(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const validationError = validateRequiredFields(body, ['validationResult']);
    if (validationError) {
      return NextResponse.json({
        success: false,
        message: validationError
      }, { status: 400 });
    }

    const engine = getAutonomousEngine();
    
    // Convert base64 documents if provided
    const documents = body.documents ? body.documents.map((doc: any) => {
      // In a real implementation, you'd convert base64 to File objects
      return new File([new Uint8Array()], doc.name || 'document.jpg', { 
        type: doc.type || 'image/jpeg' 
      });
    }) : [];
    
    const result = await engine.processDocumentAutonomously(
      documents,
      body.validationResult,
      body.userContext
    );
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, 'predict_submission_success');
  }
}

/**
 * GET /api/autonomous/predictions/history
 * Get prediction history for analysis
 */
export async function getPredictionHistory(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const documentType = searchParams.get('documentType');
    
    // In a real implementation, this would query a database
    const mockHistory = {
      totalPredictions: 150,
      averageAccuracy: 87.5,
      predictions: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        predictionId: `pred_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        successProbability: 70 + Math.random() * 25,
        actualOutcome: Math.random() > 0.3,
        documentType: documentType || 'passport_photo',
        userId: userId || 'anonymous'
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: mockHistory
    });

  } catch (error) {
    return handleApiError(error, 'get_prediction_history');
  }
}

/**
 * POST /api/autonomous/feedback
 * Submit user feedback for adaptive learning
 */
export async function submitUserFeedback(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const validationError = validateRequiredFields(body, ['userId', 'predictionId', 'actualOutcome']);
    if (validationError) {
      return NextResponse.json({
        success: false,
        message: validationError
      }, { status: 400 });
    }

    const engine = getAutonomousEngine();
    
    // Create feedback object
    const feedback = {
      feedbackId: `feedback_${Date.now()}`,
      userId: body.userId,
      predictionId: body.predictionId,
      timestamp: new Date(),
      userCorrection: {
        actualOutcome: body.actualOutcome,
        userRating: body.userRating || 3,
        rejectionReasons: body.rejectionReasons || [],
        additionalComments: body.additionalComments
      },
      contextData: body.contextData || {},
      processed: false
    };
    
    // In a real implementation, this would be stored and processed by the learning system
    console.log('User feedback received:', feedback);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback.feedbackId,
      willTriggerLearning: true
    });

  } catch (error) {
    return handleApiError(error, 'submit_user_feedback');
  }
}

// ============================================================================
// PERSONALIZED GUIDANCE
// ============================================================================

/**
 * GET /api/autonomous/guidance/:userId
 * Get personalized guidance and tips for a user
 */
export async function getPersonalizedGuidance(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // In a real implementation, this would query user history and generate guidance
    const mockGuidance = {
      userId,
      skillLevel: 'intermediate' as const,
      personalizedAdvice: [
        'Your document quality has improved significantly over recent submissions',
        'Focus on consistent lighting for better results',
        'Consider using the quality check feature before final submission'
      ],
      strongPoints: [
        'Excellent document centering',
        'Consistent image quality',
        'Good understanding of requirements'
      ],
      improvementAreas: [
        'Reduce background distractions',
        'Ensure proper document orientation'
      ],
      nextBestActions: [
        'Try the automatic quality enhancement feature',
        'Review the detailed requirements guide'
      ],
      successPrediction: {
        nextSubmissionProbability: 92,
        timeToExpertLevel: '2-3 successful submissions',
        milestones: [
          'Achieve 95% success rate',
          'Help 5 other users with advice',
          'Master advanced document types'
        ]
      }
    };
    
    return NextResponse.json({
      success: true,
      data: mockGuidance
    });

  } catch (error) {
    return handleApiError(error, 'get_personalized_guidance');
  }
}

/**
 * GET /api/autonomous/alerts/:userId
 * Get real-time alerts for a user
 */
export async function getUserAlerts(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const engine = getAutonomousEngine();
    
    // In a real implementation, this would get alerts from the predictive engine
    const mockAlerts = [
      {
        alertId: `alert_${Date.now()}_1`,
        userId,
        alertType: 'quality_alert' as const,
        severity: 'warning' as const,
        message: 'Image quality is below recommended threshold',
        actionRequired: true,
        suggestedActions: ['Improve lighting', 'Use higher resolution camera'],
        triggerCondition: 'Quality score < 70',
        timestamp: new Date(),
        dismissed: false
      },
      {
        alertId: `alert_${Date.now()}_2`,
        userId,
        alertType: 'optimization_tip' as const,
        severity: 'info' as const,
        message: 'Consider submitting during peak hours for faster processing',
        actionRequired: false,
        suggestedActions: ['Submit between 10 AM - 4 PM'],
        triggerCondition: 'Off-peak submission detected',
        timestamp: new Date(),
        dismissed: false
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockAlerts
    });

  } catch (error) {
    return handleApiError(error, 'get_user_alerts');
  }
}

/**
 * POST /api/autonomous/alerts/:userId/:alertId/dismiss
 * Dismiss a specific alert
 */
export async function dismissUserAlert(
  request: NextRequest,
  { params }: { params: { userId: string; alertId: string } }
): Promise<NextResponse> {
  try {
    const { userId, alertId } = params;
    
    if (!userId || !alertId) {
      return NextResponse.json({
        success: false,
        message: 'User ID and Alert ID are required'
      }, { status: 400 });
    }

    const engine = getAutonomousEngine();
    
    // In a real implementation, this would dismiss the alert in the predictive engine
    const dismissed = true; // engine.dismissAlert(userId, alertId);
    
    if (dismissed) {
      return NextResponse.json({
        success: true,
        message: 'Alert dismissed successfully',
        alertId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Alert not found or already dismissed'
      }, { status: 404 });
    }

  } catch (error) {
    return handleApiError(error, 'dismiss_user_alert');
  }
}

// ============================================================================
// DISCOVERY AND SCHEMA MANAGEMENT
// ============================================================================

/**
 * POST /api/autonomous/discovery/trigger
 * Manually trigger form discovery
 */
export async function triggerFormDiscovery(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const sources = body.sources || [];
    const immediate = body.immediate || false;
    
    // In a real implementation, this would trigger discovery workflows
    const discoveryJob = {
      jobId: `discovery_${Date.now()}`,
      sources: sources.length > 0 ? sources : ['automatic'],
      status: 'queued',
      estimatedCompletion: new Date(Date.now() + 1800000), // 30 minutes
      priority: immediate ? 'high' : 'medium'
    };
    
    return NextResponse.json({
      success: true,
      message: 'Form discovery triggered successfully',
      data: discoveryJob
    });

  } catch (error) {
    return handleApiError(error, 'trigger_form_discovery');
  }
}

/**
 * GET /api/autonomous/discovery/results
 * Get recent discovery results
 */
export async function getDiscoveryResults(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const since = searchParams.get('since'); // ISO date string
    
    // Mock discovery results
    const mockResults = {
      totalDiscovered: 45,
      newFormsFound: 8,
      schemasGenerated: 12,
      results: Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        discoveryId: `disc_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        source: `https://example.edu/forms/exam${i}.html`,
        formsFound: Math.floor(Math.random() * 5) + 1,
        schemaGenerated: Math.random() > 0.3,
        confidence: 70 + Math.random() * 25,
        documentTypes: ['application_form', 'id_verification', 'exam_registration']
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: mockResults
    });

  } catch (error) {
    return handleApiError(error, 'get_discovery_results');
  }
}

/**
 * GET /api/autonomous/schemas
 * Get discovered schemas
 */
export async function getDiscoveredSchemas(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');
    const active = searchParams.get('active') === 'true';
    
    // Mock schema data
    const mockSchemas = [
      {
        schemaId: 'schema_passport_2024',
        name: 'Passport Photo Validation Schema',
        documentType: 'passport_photo',
        version: '1.2.0',
        active: true,
        confidence: 95,
        lastUpdated: new Date().toISOString(),
        fields: [
          { name: 'face_detection', required: true, confidence: 0.9 },
          { name: 'background_color', required: true, confidence: 0.85 },
          { name: 'image_dimensions', required: true, confidence: 0.95 }
        ],
        validationRules: [
          { rule: 'face_visible', weight: 0.3 },
          { rule: 'proper_lighting', weight: 0.25 },
          { rule: 'neutral_expression', weight: 0.2 }
        ]
      },
      {
        schemaId: 'schema_signature_2024',
        name: 'Digital Signature Schema',
        documentType: 'signature',
        version: '1.1.0', 
        active: true,
        confidence: 88,
        lastUpdated: new Date(Date.now() - 86400000).toISOString(),
        fields: [
          { name: 'signature_present', required: true, confidence: 0.92 },
          { name: 'stroke_analysis', required: true, confidence: 0.78 }
        ],
        validationRules: [
          { rule: 'signature_clarity', weight: 0.4 },
          { rule: 'authentic_strokes', weight: 0.35 }
        ]
      }
    ];
    
    let filteredSchemas = mockSchemas;
    
    if (documentType) {
      filteredSchemas = filteredSchemas.filter(s => s.documentType === documentType);
    }
    
    if (active) {
      filteredSchemas = filteredSchemas.filter(s => s.active);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalSchemas: filteredSchemas.length,
        schemas: filteredSchemas
      }
    });

  } catch (error) {
    return handleApiError(error, 'get_discovered_schemas');
  }
}

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

/**
 * GET /api/autonomous/analytics/performance
 * Get detailed performance analytics
 */
export async function getPerformanceAnalytics(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h'; // 24h, 7d, 30d
    const component = searchParams.get('component'); // specific component filter
    
    const engine = getAutonomousEngine();
    const metrics = engine.getSystemMetrics();
    
    // Generate mock detailed analytics
    const analytics = {
      timeframe,
      component: component || 'all',
      metrics: {
        ...metrics,
        trends: {
          predictionAccuracy: [85, 87, 89, 88, 91, 92, 87], // Last 7 days
          discoverySuccess: [3, 5, 2, 4, 6, 3, 4], // Forms discovered per day
          userSatisfaction: [4.1, 4.2, 4.0, 4.3, 4.2, 4.4, 4.2], // Daily ratings
          systemLoad: [45, 52, 38, 41, 67, 59, 43] // CPU usage %
        },
        comparisons: {
          vsLastPeriod: {
            predictionAccuracy: +5.2,
            discoveryRate: +12.3,
            userSatisfaction: +3.1,
            responseTime: -8.7
          }
        }
      },
      insights: [
        {
          type: 'performance',
          message: 'Prediction accuracy improved by 5.2% this week',
          impact: 'positive'
        },
        {
          type: 'discovery',
          message: 'Discovered 4.3 new forms per day on average',
          impact: 'positive'
        },
        {
          type: 'optimization',
          message: 'System load peaked at 67% - consider resource scaling',
          impact: 'neutral'
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    return handleApiError(error, 'get_performance_analytics');
  }
}

/**
 * GET /api/autonomous/analytics/users
 * Get user behavior analytics
 */
export async function getUserAnalytics(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    
    // Mock user analytics
    const analytics = {
      timeframe,
      totalUsers: 1247,
      activeUsers: 892,
      newUsers: 156,
      userDistribution: {
        beginner: 35,
        intermediate: 52,
        expert: 13
      },
      behaviorPatterns: {
        peakHours: [9, 10, 11, 14, 15, 16], // Hours with most activity
        averageRetries: 1.8,
        successRateByLevel: {
          beginner: 67,
          intermediate: 84,
          expert: 96
        },
        commonIssues: [
          { issue: 'Image quality', frequency: 34 },
          { issue: 'Background requirements', frequency: 28 },
          { issue: 'Document orientation', frequency: 19 }
        ]
      },
      satisfaction: {
        averageRating: 4.2,
        npsScore: 72,
        topComplaints: [
          'Processing time too slow',
          'Unclear error messages',
          'Complex requirements'
        ],
        topPraises: [
          'Accurate predictions',
          'Helpful guidance',
          'Easy to use interface'
        ]
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    return handleApiError(error, 'get_user_analytics');
  }
}

// Export all functions for Next.js API routes
export {
  startAutonomousEngine as POST_start_engine,
  stopAutonomousEngine as POST_stop_engine,
  getAutonomousStatus as GET_status,
  updateAutonomousConfig as PUT_config,
  predictSubmissionSuccess as POST_predict,
  getPredictionHistory as GET_prediction_history,
  submitUserFeedback as POST_feedback,
  getPersonalizedGuidance as GET_guidance,
  getUserAlerts as GET_alerts,
  dismissUserAlert as POST_dismiss_alert,
  triggerFormDiscovery as POST_trigger_discovery,
  getDiscoveryResults as GET_discovery_results,
  getDiscoveredSchemas as GET_schemas,
  getPerformanceAnalytics as GET_performance_analytics,
  getUserAnalytics as GET_user_analytics
};