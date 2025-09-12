import { resizeImage } from './utils/resizeImage';
import { convertFormat } from './utils/convertFormat';
import { compressImage } from './utils/compressImage';
import { normalizeName } from './utils/normalizeName';
import { Requirement } from '@/features/exam/examSchema';

export async function transformFile(file: File, req: Requirement): Promise<File> {
  let transformed = file;

  // Resize if dimensions are specified
  if (req.dimensions) {
    transformed = await resizeImage(transformed, req.dimensions);
  }

  // Convert format if needed
  if (req.format && transformed.type !== req.format) {
    transformed = await convertFormat(transformed, req.format);
  }

  // Compress if size exceeds max
  const sizeKB = Math.round(transformed.size / 1024);
  if (req.maxSizeKB && sizeKB > req.maxSizeKB) {
    transformed = await compressImage(transformed, req.maxSizeKB);
  }

  // Normalize filename
  transformed = normalizeName(transformed, req.type);

  return transformed;
}
