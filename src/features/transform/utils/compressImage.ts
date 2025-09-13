export async function compressImage(file: File, maxSizeKB: number): Promise<File> {
  let quality = 1.0;
  let attempt = 0;
  const MAX_ATTEMPTS = 10;

  // Create an image element
  const image = new Image();
  const imageUrl = URL.createObjectURL(file);

  // Load the image
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Failed to load image for compression'));
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

  // Compress with decreasing quality until size is under maxSize
  while (attempt < MAX_ATTEMPTS) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create compressed blob from canvas'));
            return;
          }
          resolve(blob);
        }, file.type, quality);
      } catch (error) {
        reject(error);
      }
    });

    if (blob.size / 1024 <= maxSizeKB || quality < 0.1) {
      // Clean up
      URL.revokeObjectURL(imageUrl);

      // Return compressed file
      return new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });
    }

    // Reduce quality for next attempt
    quality *= 0.9;
    attempt++;
  }

  throw new Error(`Failed to compress image to target size after ${MAX_ATTEMPTS} attempts`);
}
