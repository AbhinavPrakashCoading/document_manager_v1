export function logDecision(fileName: string, mode: 'strict' | 'fallback', reason: string) {
  console.log(`[VALIDATION] ${fileName} → ${mode.toUpperCase()} MODE: ${reason}`);
}

export interface AuditEntry {
  file: string;
  rollNumber: string;
  result: string;
  mode: string;
  errors?: { type: string; message: string }[];
  meta?: Record<string, any>;
}

export async function persistAudit(entry: AuditEntry) {
  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error('Failed to persist audit log');
    }
  } catch (error) {
    console.error('Error persisting audit:', error);
    // Still log to console in case of API failure
    console.log('[AUDIT]', entry);
  }
}