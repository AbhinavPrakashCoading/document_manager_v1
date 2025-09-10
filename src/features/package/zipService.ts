import JSZip from 'jszip';
import { FileWithMeta } from './types';
import { persistAudit } from '@/features/audit/logger';

export async function generateZip(
  files: FileWithMeta[],
  schema: any,
  options?: { format?: 'zip' | 'tar'; rollNumber?: string }
): Promise<void> {
  const zip = new JSZip();
  let totalSize = 0;

  const ordered = schema.requirements.map((r) =>
    files.find((f) => f.requirement?.type === r.type)
  ).filter(Boolean);

  ordered.forEach((f) => {
    zip.file(f.file.name, f.file);
    totalSize += f.file.size;
  });

  const estimatedKB = Math.round(totalSize / 1024);
  console.log(`[ZIP] Estimated size: ${estimatedKB}KB`);

  persistAudit({
    file: 'submission.zip',
    rollNumber: options?.rollNumber ?? 'unknown',
    result: 'ZIP generated',
    mode: 'packaging',
    errors: [],
    meta: {
      estimatedSizeKB: estimatedKB,
      schemaVersion: schema.version ?? 'unknown',
      format: options?.format ?? 'zip',
    },
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'submission.zip';
  a.click();
  URL.revokeObjectURL(url);

  // Stub: TAR support
  if (options?.format === 'tar') {
    console.warn('[ZIP] .tar.gz output not yet implemented');
  }
}