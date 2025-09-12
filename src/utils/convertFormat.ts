export async function convertFormat(file: File, targetType: string): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0);
  const blob = await canvas.convertToBlob({ type: targetType });
  const newName = file.name.replace(/\.\w+$/, targetType.split('/')[1]);
  return new File([blob], newName, { type: targetType });
}