import { ExamSchema } from './schema/types';
import { fetchHTML, extractText } from '../utils/html';

export async function scrapeUPSC(): Promise<ExamSchema> {
  const html = await fetchHTML('https://upsc.gov.in/document-guidelines');
  const photoSpec = extractText(html, '#photo-spec');
  const signSpec = extractText(html, '#sign-spec');

  return {
    examId: 'upsc',
    examName: 'UPSC Civil Services',
    requirements: [
      {
        type: 'Photo',
        format: 'JPEG',
        maxSizeKB: 50,
        dimensions: '200x230',
        namingConvention: 'photo_rollno.jpg',
      },
      {
        type: 'Signature',
        format: 'JPEG',
        maxSizeKB: 20,
        dimensions: '140x60',
        namingConvention: 'sign_rollno.jpg',
      },
    ],
  };
}