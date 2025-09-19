/**
 * Adds a black bar with user name and Date of Photography to the bottom of an image
 */

export interface DOPBandOptions {
  userName: string;
  dateOfPhotography: string;
  bandHeight?: number;
  fontSize?: number;
  padding?: number;
  textColor?: string;
  backgroundColor?: string;
}

export async function addDOPBand(
  imageFile: File, 
  options: DOPBandOptions
): Promise<File> {
  const {
    userName,
    dateOfPhotography,
    bandHeight = 50,
    fontSize = 14,
    padding = 10,
    textColor = '#FFFFFF',
    backgroundColor = '#000000'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas dimensions to original image size plus band height
        canvas.width = img.width;
        canvas.height = img.height + bandHeight;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Draw black band at bottom
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, img.height, canvas.width, bandHeight);

        // Configure text style
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'middle';

        // Format the date nicely
        const formattedDate = new Date(dateOfPhotography).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Prepare text lines
        const line1 = `Name: ${userName.toUpperCase()}`;
        const line2 = `DOP: ${formattedDate}`;

        // Calculate text positioning
        const line1Y = img.height + (bandHeight / 3);
        const line2Y = img.height + (2 * bandHeight / 3);

        // Draw text with proper alignment
        ctx.textAlign = 'left';
        ctx.fillText(line1, padding, line1Y);
        ctx.fillText(line2, padding, line2Y);

        // Add a subtle border at the top of the band
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, img.height);
        ctx.lineTo(canvas.width, img.height);
        ctx.stroke();

        // Convert canvas to blob and create new file
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          // Create new file with DOP suffix
          const originalName = imageFile.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
          const extension = originalName.substring(originalName.lastIndexOf('.'));
          const newFileName = `${nameWithoutExt}_with_DOP${extension}`;

          const modifiedFile = new File([blob], newFileName, {
            type: imageFile.type,
            lastModified: Date.now()
          });

          resolve(modifiedFile);
        }, imageFile.type, 0.95); // High quality

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Checks if a file is an image that can have DOP band added
 */
export function canAddDOPBand(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return supportedTypes.includes(file.type.toLowerCase());
}

/**
 * Estimates the new file size after adding DOP band
 */
export function estimateDOPBandSize(originalFile: File, bandHeight: number = 50): number {
  // Rough estimation: original size + ~10% for the band
  const bandRatio = bandHeight / 200; // Assuming average image height of 200px
  return Math.round(originalFile.size * (1 + bandRatio));
}