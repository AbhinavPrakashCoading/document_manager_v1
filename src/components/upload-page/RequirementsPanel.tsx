import { ExamSchema } from '@/features/exam/examSchema';

export function RequirementsPanel({ schema }: { schema: ExamSchema }) {
  return (
    <section className="max-w-md mx-auto mb-6 text-sm bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">📋 Requirements Preview</h2>
      <ul className="list-disc ml-4 space-y-1 text-gray-700">
        {schema.properties.documents.items.properties.type.enum.map((type) => (
          <li key={type}>
            <strong>{type}</strong>
            <span className="text-gray-500"> - Standard Document Requirements</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
