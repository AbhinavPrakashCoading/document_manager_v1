export function normalizeName(file: File, type: string): File {
  const ext = file.name.split('.').pop();
  const newName = `${type.toLowerCase()}.${ext}`;
  return new File([file], newName, { type: file.type });
}
