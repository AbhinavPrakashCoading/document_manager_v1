'use client';

export function ProcessButton({ onProcess }: { onProcess: () => void }) {
  return (
    <div className="text-center mt-6">
      <button
        onClick={onProcess}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm"
      >
        🛠️ Process Files to Match Schema
      </button>
    </div>
  );
}
