export function normalizeName(file: File, type: string): File {
  // Get file extension from mime type
  const extension = file.type.split('/')[1];
  
  // Create normalized name:
  // - Convert to lowercase
  // - Replace spaces with underscores
  // - Remove special characters except underscore and hyphen
  // - Add document type and timestamp
  const timestamp = new Date().getTime();
  const normalizedName = `${type}_${timestamp}.${extension}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '');

  // Return new file with normalized name
  return new File([file], normalizedName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
