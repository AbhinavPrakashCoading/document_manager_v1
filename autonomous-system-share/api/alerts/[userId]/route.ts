/**
 * Next.js API Route: User Alerts Management
 * Handles real-time alerts for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserAlerts } from '@/api/autonomous';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return getUserAlerts(request, { params });
}