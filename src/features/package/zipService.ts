import JSZip from 'jszip';
import { FileWithMeta } from '@/features/package/types';
import { ExamSchema } from '@/features/exam/examSchema';
import { DocumentRequirement } from '@/features/exam/types';
import { persistAudit } from '@/features/audit/logger';

export async function generateZip(
  files: FileWithMeta[],
  schema: ExamSchema,
  options?: { format?: 'zip' | 'tar'; rollNumber?: string }
): Promise<{ success: boolean; error?: string; blob?: Blob }> {
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
  const dopMetadata: any[] = [];
  
  for (const fileEntry of ordered) {
    if (!fileEntry) continue;
    
    try {
      const file = fileEntry.file;
      if (file instanceof Blob) {
        zip.file(file.name, file);
        totalSize += file.size;
        
        // Check for DOP metadata
        const dopData = (file as any).dopMetadata;
        if (dopData) {
          dopMetadata.push({
            filename: file.name,
            documentType: fileEntry.requirement?.type || 'unknown',
            dateOfPhotography: dopData.date,
            dateFormatted: dopData.formatted,
            addedAt: new Date().toISOString()
          });
        }
      } else {
        console.error('[ZIP] Invalid file object:', file);
        return { success: false, error: 'Invalid file object' };
      }
    } catch (error) {
      console.error('[ZIP] Error adding file to zip:', error);
      return { success: false, error: 'Error adding file to zip' };
    }
  }

  // Add DOP metadata file if we have any DOP data
  if (dopMetadata.length > 0) {
    const dopInfo = {
      generatedAt: new Date().toISOString(),
      examType: schema.examName || schema.examId,
      rollNumber: options?.rollNumber || 'unknown',
      dateOfPhotographyRecords: dopMetadata,
      note: 'This file contains Date of Photography information for uploaded documents'
    };
    
    zip.file('DOP_METADATA.json', JSON.stringify(dopInfo, null, 2));
    console.log('[ZIP] Added DOP metadata for', dopMetadata.length, 'files');
  }

  const estimatedKB = Math.round(totalSize / 1024);
  console.log(`[ZIP] Estimated size: ${estimatedKB}KB`);

  try {
    // Log the operation (non-blocking)
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
        dopRecordsCount: dopMetadata.length,
        dopFiles: dopMetadata.map(d => ({ filename: d.filename, date: d.dateOfPhotography }))
      }
    }).catch(err => {
      console.warn('[ZIP] Audit logging failed, continuing with download:', err);
    });

    // Generate zip file
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options?.rollNumber || 'submission'}_documents.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Warn if tar format was requested but not supported
    if (options?.format === 'tar') {
      console.warn('[ZIP] .tar.gz output not yet implemented');
    }

    return { success: true, blob };
  } catch (error) {
    console.error('[ZIP] Error:', error);
    return { success: false, error: String(error) };
  }
}