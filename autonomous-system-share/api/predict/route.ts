/**
 * Next.js API Route: Autonomous Prediction System
 * Handles predictive validation and submission success analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictSubmissionSuccess, getPredictionHistory } from '@/api/autonomous';

export async function POST(request: NextRequest) {
  return predictSubmissionSuccess(request);
}

export async function GET(request: NextRequest) {
  return getPredictionHistory(request);
}