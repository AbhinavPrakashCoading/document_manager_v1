/**
 * Next.js API Route: Schema Management
 * Handles discovered schema retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveredSchemas } from '@/api/autonomous';

export async function GET(request: NextRequest) {
  return getDiscoveredSchemas(request);
}