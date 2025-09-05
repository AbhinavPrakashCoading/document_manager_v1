import { useState } from 'react';

export function ExamSelector() {
  const [schemas, setSchemas] = useState<ExamSchema[]>([]);

  const addExam = async (examId: string) => {
    const res = await fetch('/api/exam', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    });

    const schema = await res.json();
    setSchemas((prev) => [...prev, schema]); // inject into validator
  };

  return (
    <div>
      {/* Existing exam dropdown */}
      <select onChange={(e) => addExam(e.target.value)}>
        <option value="">Select Exam</option>
        <option value="upsc">UPSC</option>
        <option value="ssc">SSC</option>
        <option value="ielts">IELTS</option>
        {/* More options */}
      </select>

      {/* Add another button */}
      <button onClick={() => addExam('custom')}>Add another</button>

      {/* You can now pass `schemas` to your validator or upload hook */}
    </div>
  );
}