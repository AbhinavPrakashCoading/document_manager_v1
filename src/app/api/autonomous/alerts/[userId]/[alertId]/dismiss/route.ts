/**
 * Next.js API Route: Alert Dismissal
 * Handles dismissing specific user alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { dismissUserAlert } from '@/api/autonomous';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; alertId: string } }
) {
  return dismissUserAlert(request, { params });
}