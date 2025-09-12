export async function convertFormat(file: File, targetFormat: string): Promise<File> {
  // Create an image element
  const image = new Image();
  const imageUrl = URL.createObjectURL(file);

  // Load the image
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Failed to load image for format conversion'));
    image.src = imageUrl;
  });

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(image, 0, 0);

  // Convert to blob with new format
  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob during format conversion'));
          return;
        }
        resolve(blob);
      }, targetFormat, 0.95); // Added quality parameter for better compression
    } catch (error) {
      reject(error);
    }
  });

  // Clean up
  URL.revokeObjectURL(imageUrl);

  // Create new filename with correct extension
  const extension = targetFormat.split('/')[1];
  const newFilename = file.name.replace(/\.[^.]+$/, `.${extension}`);

  // Return new file
  return new File([blob], newFilename, {
    type: targetFormat,
    lastModified: file.lastModified,
  });
}
