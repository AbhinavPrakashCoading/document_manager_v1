'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function ZipConfirmation({ rollNumber }: { rollNumber: string }) {
  useEffect(() => {
    toast.success(`✅ ZIP packaged successfully for Roll No: ${rollNumber}`, {
      duration: 6000,
      position: 'top-center',
    });
  }, [rollNumber]);

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-4 rounded shadow text-sm text-gray-700 space-y-4">
      <h2 className="text-lg font-semibold text-green-700">🎉 Submission Ready</h2>
      <p>Your documents have been validated and packaged into a ZIP file.</p>

      <ul className="list-disc ml-4 space-y-1">
        <li>✅ All files matched schema requirements</li>
        <li>📦 ZIP size estimated and logged</li>
        <li>🧾 Audit trail saved locally</li>
      </ul>

      <div className="flex gap-4 pt-4">
        <button
          onClick={() => location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Upload Another
        </button>
        <a
          href="/registry"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          View Registry
        </a>
      </div>
    </div>
  );
}