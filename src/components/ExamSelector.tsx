'use client';

import { useState } from 'react';

export function ExamSelector({ onSchemaFetched }: { onSchemaFetched: (schema: any) => void }) {
  const [selectedExam, setSelectedExam] = useState('');
  const [mode, setMode] = useState<'live' | 'versioned' | 'fallback'>('versioned');

  const exams = [
    { id: 'upsc', name: 'UPSC', icon: '🗳️' },
    { id: 'ssc', name: 'SSC', icon: '📜' },
    { id: 'ielts', name: 'IELTS', icon: '🌍' },
  ];

  const fetchSchema = async () => {
    if (!selectedExam) return;

    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: selectedExam, mode }),
    });

    const schema = await res.json();
    onSchemaFetched(schema);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {exams.map((exam) => (
          <button
            key={exam.id}
            onClick={() => setSelectedExam(exam.id)}
            className={`px-4 py-2 rounded border text-sm ${
              selectedExam === exam.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            {exam.icon} {exam.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm">Schema Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="border px-2 py-1 rounded w-full"
        >
          <option value="live">Live Scrape</option>
          <option value="versioned">Latest Version</option>
          <option value="fallback">Fallback</option>
        </select>
      </div>

      <button
        onClick={fetchSchema}
        disabled={!selectedExam}
        className={`px-4 py-2 rounded text-white ${
          selectedExam ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        Fetch Schema
      </button>
    </div>
  );
}