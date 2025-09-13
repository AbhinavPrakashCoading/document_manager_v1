'use client';

export function CompletionButtons({ allUploaded, onNext }: { allUploaded: boolean; onNext: () => void }) {
  return (
    <div className="flex justify-between mt-8">
      <a href="/select" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
        ← Back
      </a>
      <button
        disabled={!allUploaded}
        onClick={onNext}
        className={`px-4 py-2 rounded text-white text-sm ${
          allUploaded ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        Next →
      </button>
    </div>
  );
}
