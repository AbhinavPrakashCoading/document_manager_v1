'use client';

import { ExamSchema } from '@/features/exam/examSchema';
import { UploadForm } from './UploadForm';

export { UploadZone };

function UploadZone({ schema }: { schema: ExamSchema }) {
  return (
    <UploadForm schema={schema} />
  );
}
