import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const logPath = path.resolve(process.cwd(), 'logs/audit.json');
    const logDir = path.dirname(logPath);

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Read existing logs or initialize empty array
    const existing = fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
      : [];

    // Add new entry with timestamp
    existing.push({
      timestamp: new Date().toISOString(),
      ...data
    });

    // Write back to file
    fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log audit entry' },
      { status: 500 }
    );
  }
}
