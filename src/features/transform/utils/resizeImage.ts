export interface Dimensions {
  width: number;
  height: number;
}

function isValidBlob(blob: Blob | null): blob is Blob {
  return blob !== null && blob.size > 0;
}

async function blobFromCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (isValidBlob(blob)) {
            resolve(blob);
          } else {
            console.warn('toBlob returned invalid blob');
            resolve(null);
          }
        },
        type,
        quality
      );
    } catch (e) {
      console.warn('toBlob failed:', e);
      resolve(null);
    }
  });
}

async function blobFromDataUrl(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return isValidBlob(blob) ? blob : null;
  } catch (e) {
    console.warn('dataUrl conversion failed:', e);
    return null;
  }
}

async function createBlobFromCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number = 1.0
): Promise<Blob> {
  console.log('Creating blob with:', { type, quality, canvasSize: `${canvas.width}x${canvas.height}` });
  
  // Normalize type
  const mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const defaultType = 'image/jpeg';
  const validType = mimeTypes.includes(type) ? type : defaultType;

  // Try original type first
  const originalBlob = await blobFromCanvas(canvas, validType, quality);
  if (isValidBlob(originalBlob)) {
    console.log('Created blob successfully with original type');
    return originalBlob;
  }

  // Try different mime types
  for (const mimeType of mimeTypes) {
    if (mimeType === validType) continue; // Skip original type

    const alternateBlob = await blobFromCanvas(canvas, mimeType, quality);
    if (isValidBlob(alternateBlob)) {
      console.log(`Created blob with alternate type: ${mimeType}`);
      return alternateBlob;
    }
  }

  // Try different quality levels
  const qualities = [0.9, 0.7, 0.5, 0.3];
  for (const q of qualities) {
    for (const mimeType of mimeTypes) {
      const qualityBlob = await blobFromCanvas(canvas, mimeType, q);
      if (isValidBlob(qualityBlob)) {
        console.log(`Created blob with reduced quality: ${q}, type: ${mimeType}`);
        return qualityBlob;
      }
    }
  }

  // Try data URL approach
  try {
    for (const mimeType of mimeTypes) {
      try {
        const dataUrl = canvas.toDataURL(mimeType, 0.7);
        const dataUrlBlob = await blobFromDataUrl(dataUrl);
        if (isValidBlob(dataUrlBlob)) {
          console.log(`Created blob via dataURL with type: ${mimeType}`);
          return dataUrlBlob;
        }
      } catch (e) {
        console.warn(`dataURL failed for ${mimeType}:`, e);
      }
    }
  } catch (e) {
    console.warn('All dataURL attempts failed:', e);
  }

  // Last resort: try creating a small JPEG
  const smallCanvas = document.createElement('canvas');
  const maxSize = 800;
  const scale = Math.min(1, maxSize / Math.max(canvas.width, canvas.height));
  smallCanvas.width = Math.floor(canvas.width * scale);
  smallCanvas.height = Math.floor(canvas.height * scale);

  try {
    const ctx = smallCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
      const scaledBlob = await blobFromCanvas(smallCanvas, 'image/jpeg', 0.5);
      if (isValidBlob(scaledBlob)) {
        console.log('Created blob with scaled down canvas');
        return scaledBlob;
      }
    }
  } catch (e) {
    console.warn('Scaled canvas attempt failed:', e);
  }

  // If everything fails, try to create a minimal valid JPEG
  try {
    const tinyCanvas = document.createElement('canvas');
    tinyCanvas.width = 100;
    tinyCanvas.height = 100;
    const ctx = tinyCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 100, 100);
      const tinyBlob = await blobFromCanvas(tinyCanvas, 'image/jpeg', 0.1);
      if (isValidBlob(tinyBlob)) {
        console.warn('Falling back to minimal valid JPEG');
        return tinyBlob;
      }
    }
  } catch (e) {
    console.error('Even minimal JPEG creation failed:', e);
  }

  throw new Error('Failed to create image blob after all attempts - no fallback succeeded');
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  
  const imageUrl = URL.createObjectURL(file);
  
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = imageUrl;
    });
    
    return image;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): Dimensions {
  const aspectRatio = originalWidth / originalHeight;
  
  if (targetWidth / targetHeight > aspectRatio) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight
    };
  } else {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio)
    };
  }
}

export async function resizeImage(file: File, dimensions: Dimensions): Promise<File> {
  // Validate input and provide fallback type if needed
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const fileType = validImageTypes.includes(file.type) ? file.type : 'image/jpeg';

  // Ensure reasonable dimensions
  const maxDimension = 4096; // Maximum safe dimension
  const validDimensions = {
    width: Math.min(Math.max(1, dimensions.width), maxDimension),
    height: Math.min(Math.max(1, dimensions.height), maxDimension)
  };

  try {
    // Load the image with timeout
    const image = await Promise.race([
      loadImage(file),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image load timeout')), 10000)
      )
    ]);

    // Ensure the image has valid dimensions
    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      throw new Error('Loaded image has invalid dimensions');
    }

    // Calculate dimensions maintaining aspect ratio with safe values
    const newDimensions = calculateDimensions(
      image.naturalWidth,
      image.naturalHeight,
      validDimensions.width,
      validDimensions.height
    );

    // Create canvas with the new dimensions
    const canvas = document.createElement('canvas');
    canvas.width = newDimensions.width;
    canvas.height = newDimensions.height;

    // Get context with settings for better quality
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: true
    });

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use better quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas and draw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image with proper dimensions
    ctx.drawImage(
      image,
      0, 0,
      newDimensions.width,
      newDimensions.height
    );

    // Try to create blob with multiple attempts if needed
    const blob = await createBlobFromCanvas(canvas, file.type);

    // Create new file with original metadata
    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });

  } catch (error) {
    // If we completely fail, try to return the original file
    console.error('Image resize failed:', error);
    console.warn('Returning original file as fallback');
    return file;
  }
}
