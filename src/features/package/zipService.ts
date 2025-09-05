import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DocumentRequirement, ExamSchema } from '@/features/exam/examSchema';

export type FileWithMeta = {
  file: File;
  requirement: DocumentRequirement;
  rollNumber: string;
};

export async function generateZip(files: FileWithMeta[], exam: ExamSchema) {
  const zip = new JSZip();
  const folder = zip.folder(exam.examName.replace(/\s+/g, '_'))!;

  for (const { file, requirement, rollNumber } of files) {
    const fileData = await file.arrayBuffer();
    const defaultName = `${requirement.type.toLowerCase()}_${rollNumber}.${requirement.format.toLowerCase()}`;
    const fileName = requirement.namingConvention?.replace('rollno', rollNumber) || defaultName;
    folder.file(fileName, fileData);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${exam.examName.replace(/\s+/g, '_')}_Documents.zip`);
}
