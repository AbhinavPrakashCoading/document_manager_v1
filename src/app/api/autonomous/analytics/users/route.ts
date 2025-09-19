/**
 * Next.js API Route: User Analytics
 * Provides user behavior and satisfaction analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserAnalytics } from '@/api/autonomous';

export async function GET(request: NextRequest) {
  return getUserAnalytics(request);
}