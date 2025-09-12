import JSZip from 'jszip';
import { FileWithMeta, ExamSchema } from '@/features/package/types';
import { DocumentRequirement } from '@/features/exam/types';
import { persistAudit } from '@/features/audit/logger';

export async function generateZip(
  files: FileWithMeta[],
  schema: ExamSchema,
  options?: { format?: 'zip' | 'tar'; rollNumber?: string }
): Promise<void> {
  const zip = new JSZip();
  let totalSize = 0;

  // Ensure we have requirements to work with
  const requirements = schema.requirements || [];
  if (requirements.length === 0) {
    console.warn('[ZIP] No requirements found in schema');
  }

  // Make sure files are in the correct order according to schema
  const ordered = requirements.length > 0
    ? requirements.map((r) =>
        files.find((f) => f.requirement?.type === r.type)
      ).filter(Boolean)
    : files; // If no requirements, use files as is

  // Add each file to the zip and track total size
  for (const fileEntry of ordered) {
    if (!fileEntry) continue;
    
    try {
      const file = fileEntry.file;
      if (file instanceof Blob) {
        zip.file(file.name, file);
        totalSize += file.size;
      } else {
        console.error('[ZIP] Invalid file object:', file);
        throw new Error('Invalid file object');
      }
    } catch (error) {
      console.error('[ZIP] Error adding file to zip:', error);
      throw error;
    }
  }

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