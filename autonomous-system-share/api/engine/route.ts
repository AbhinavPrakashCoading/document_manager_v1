/**
 * Next.js API Route: Autonomous Engine Management
 * Handles starting, stopping, and configuring the autonomous engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  startAutonomousEngine, 
  stopAutonomousEngine, 
  getAutonomousStatus, 
  updateAutonomousConfig 
} from '@/api/autonomous';

export async function GET(request: NextRequest) {
  return getAutonomousStatus(request);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  switch (action) {
    case 'start':
      return startAutonomousEngine(request);
    case 'stop':
      return stopAutonomousEngine(request);
    default:
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid action. Use ?action=start or ?action=stop' 
        },
        { status: 400 }
      );
  }
}

export async function PUT(request: NextRequest) {
  return updateAutonomousConfig(request);
}