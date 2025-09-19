/**
 * Next.js API Route: Personalized User Guidance
 * Provides personalized tips and recommendations based on user history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedGuidance } from '@/api/autonomous';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return getPersonalizedGuidance(request, { params });
}