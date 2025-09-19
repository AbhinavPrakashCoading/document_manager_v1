/**
 * Next.js API Route: Performance Analytics
 * Provides detailed analytics on autonomous system performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceAnalytics } from '@/api/autonomous';

export async function GET(request: NextRequest) {
  return getPerformanceAnalytics(request);
}