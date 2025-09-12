'use client';

import { useRouter } from 'next/navigation';

const exams = [
  { id: 'ssc', label: 'SSC', icon: '📜' },
  { id: 'upsc', label: 'UPSC', icon: '🗳️' },
  { id: 'ielts', label: 'IELTS', icon: '🌍' },
];

export function ExamGrid() {
  const router = useRouter();

  const handleSelect = (examId: string) => {
    localStorage.setItem('selectedExam', examId);
    router.push(`/upload?exam=${examId}`);
  };

  return (
    <section className="py-8 px-4 bg-white">
      <h2 className="text-lg font-semibold text-center text-gray-700 mb-4">Supported Exams</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
        {exams.map((exam) => (
          <button
            key={exam.id}
            onClick={() => handleSelect(exam.id)}
            className="flex flex-col items-center justify-center border rounded-lg p-6 bg-gray-50 hover:bg-blue-50 shadow-sm transition"
          >
            <span className="text-4xl">{exam.icon}</span>
            <span className="mt-2 text-sm font-medium text-gray-700">{exam.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
