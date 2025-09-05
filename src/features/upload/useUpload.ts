import { validateFileAgainstRequirement } from '@/features/exam/validateAgainstSchema';
import { ExamSchema } from '@/features/exam/examSchema';

export const validate = (file: File, schema: ExamSchema) => {
  // You can loop through all requirements or match by type
  return schema.requirements.map((req) =>
    validateFileAgainstRequirement(file, req)
  );
};