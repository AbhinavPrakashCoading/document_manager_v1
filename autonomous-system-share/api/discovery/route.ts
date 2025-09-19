/**
 * Next.js API Route: Form Discovery Management
 * Handles autonomous form discovery triggers and results
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerFormDiscovery, getDiscoveryResults } from '@/api/autonomous';

export async function POST(request: NextRequest) {
  return triggerFormDiscovery(request);
}

export async function GET(request: NextRequest) {
  return getDiscoveryResults(request);
}