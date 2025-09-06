import { useState } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { ExamSchema } from '@/features/exam/examSchema';

export function UploadZone({ schema }: { schema: ExamSchema }) {
  const { files, results, handleUpload } = useUpload(schema);
  const [rollNumber, setRollNumber] = useState('');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      Array.from(selected).forEach((file) => handleUpload(file));
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter Roll Number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      />

      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="block"
      />

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.name} className="border p-2 rounded">
            <strong>{file.name}</strong>
            {results[file.name]?.length ? (
              <ul className="text-red-600 list-disc ml-4">
                {results[file.name].map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600">✅ Valid</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}