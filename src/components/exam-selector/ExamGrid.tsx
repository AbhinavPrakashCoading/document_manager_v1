'use client';

import { useRouter } from 'next/navigation';
import { ExamCard } from './ExamCard';

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
      <h2 className="text-lg font-semibold text-center text-gray-700 mb-4">Select Your Exam</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
        {exams.map((exam) => (
          <ExamCard key={exam.id} {...exam} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}
