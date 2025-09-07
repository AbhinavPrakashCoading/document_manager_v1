import { useState } from 'react';
import { useUpload } from '@/features/upload/useUpload';
import { ExamSchema } from '@/features/exam/examSchema';
import { generateZip, FileWithMeta } from '@/features/package/zipService';
import toast from 'react-hot-toast';


export function UploadZone({ schema }: { schema: ExamSchema }) {
  const { files, results, handleUpload } = useUpload(schema);
  const [rollNumber, setRollNumber] = useState('');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      Array.from(selected).forEach((file) => handleUpload(file));
    }
  };

  const handleDownloadZip = async () => {
    const validFiles = files.filter((file) => results[file.name]?.length === 0);

    const fileWithMeta: FileWithMeta[] = validFiles.map((file) => {
      const matchedReq = schema.requirements.find((r) =>
        file.name.toLowerCase().includes(r.type.toLowerCase())
      );

      return {
        file,
        requirement: matchedReq!,
        rollNumber,
      };
    });

    await generateZip(fileWithMeta, schema);
    toast.success('ZIP downloaded successfully!');

  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter Roll Number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        className="border px-2 py-1 rounded w-full text-sm"
      />

      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="block w-full text-sm"
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

      {files.length > 0 && (
        <button
          onClick={handleDownloadZip}
          disabled={!rollNumber}
          className={`w-full sm:w-auto px-4 py-2 rounded text-white ${
  rollNumber ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
}`}
        >
          Download ZIP
        </button>
      )}
    </div>
  );
}
