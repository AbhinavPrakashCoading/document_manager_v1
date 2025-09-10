'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const exams = [
  { id: 'ssc', label: 'SSC', icon: '📜' },
  { id: 'upsc', label: 'UPSC', icon: '🗳️' },
  { id: 'ielts', label: 'IELTS', icon: '🌍' },
];

export default function ExamSelectorPage() {
  const router = useRouter();

  const handleSelect = (examId: string) => {
    localStorage.setItem('selectedExam', examId);
    router.push(`/upload?exam=${examId}`);
  };

  useEffect(() => {
    const cached = localStorage.getItem('selectedExam');
    if (cached) {
      router.prefetch(`/upload?exam=${cached}`);
    }
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 space-y-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center">🎯 Select Your Exam</h1>
      <p className="text-gray-600 text-center text-sm max-w-md">
        Choose the exam you’re applying for. We’ll load the correct schema and validation rules.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
        {exams.map((exam) => (
          <button
            key={exam.id}
            onClick={() => handleSelect(exam.id)}
            className="flex flex-col items-center justify-center border rounded-lg p-6 bg-white hover:bg-blue-50 shadow-sm transition"
          >
            <span className="text-4xl">{exam.icon}</span>
            <span className="mt-2 text-sm font-medium">{exam.label}</span>
          </button>
        ))}
      </div>

      <footer className="text-xs text-gray-500 pt-12">
        Made by Abhinav • Schema-aware engine ⚙️
      </footer>
    </main>
  );
}