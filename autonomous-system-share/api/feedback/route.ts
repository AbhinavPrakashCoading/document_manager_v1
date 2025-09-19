/**
 * Next.js API Route: User Feedback for Adaptive Learning
 * Handles user feedback submission for continuous system improvement
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitUserFeedback } from '@/api/autonomous';

export async function POST(request: NextRequest) {
  return submitUserFeedback(request);
}