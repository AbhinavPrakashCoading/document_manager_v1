'use client';

import { useState } from 'react';

interface NamingFormData {
  roll: string;
  name: string;
  age: string;
}

export function NamingPopup({ 
  onSubmit,
  onCancel 
}: { 
  onSubmit: (data: NamingFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NamingFormData>({ roll: '', name: '', age: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full space-y-4">
        <h2 className="text-lg font-semibold">🧾 Enter Naming Details</h2>
        <input
          name="roll"
          placeholder="Roll Number"
          value={form.roll}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full text-sm"
        />
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full text-sm"
        />
        <input
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(form)}
            className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
          >
            Submit
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
