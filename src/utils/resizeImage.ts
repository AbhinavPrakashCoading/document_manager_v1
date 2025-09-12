export async function resizeImage(file: File, target: string): Promise<File> {
  const [width, height] = target.split('x').map(Number);
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, width, height);
  const blob = await canvas.convertToBlob({ type: file.type });
  return new File([blob], file.name, { type: file.type });
}