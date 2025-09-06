import { useState } from 'react';

export function ExamSelector({ onSchemaFetched }: { onSchemaFetched: (schema: any) => void }) {
  const [examId, setExamId] = useState('');

  const fetchSchema = async () => {
    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId }),
    });

    const schema = await res.json();
    onSchemaFetched(schema);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Enter exam ID (e.g. upsc)"
        value={examId}
        onChange={(e) => setExamId(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      />
      <button
        onClick={fetchSchema}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Fetch Schema
      </button>
    </div>
  );
}
