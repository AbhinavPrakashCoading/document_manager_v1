'use client';

interface ExamCardProps {
  id: string;
  label: string;
  icon: string;
  onSelect: (id: string) => void;
}

export function ExamCard({ id, label, icon, onSelect }: ExamCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className="flex flex-col items-center justify-center border rounded-lg p-6 bg-gray-50 hover:bg-blue-50 shadow-sm transition"
    >
      <span className="text-4xl">{icon}</span>
      <span className="mt-2 text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}