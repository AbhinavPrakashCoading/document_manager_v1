export async function compressImage(file: File, maxKB: number): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0);

  let quality = 0.9;
  let blob: Blob;

  do {
    blob = await canvas.convertToBlob({ type: file.type, quality });
    quality -= 0.1;
  } while (blob.size / 1024 > maxKB && quality > 0.1);

  return new File([blob], file.name, { type: file.type });
}