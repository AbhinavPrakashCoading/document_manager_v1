'use client';

import { useState } from 'react';

interface UserNameInputProps {
  value: string;
  onChange: (name: string) => void;
  required?: boolean;
}

export function UserNameInput({ value, onChange, required = true }: UserNameInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and clean the input
    const cleanName = e.target.value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '') // Only allow letters and spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 50); // Limit length
    
    onChange(cleanName);
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <label className="block text-sm font-medium text-blue-900 mb-2">
        Full Name (for DOP Band)
        {required && <span className="text-red-600"> *</span>}
      </label>
      
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Enter your full name as it appears on documents"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          focused ? 'border-blue-500' : 'border-gray-300'
        }`}
      />
      
      <div className="mt-2 text-xs text-blue-700">
        <div className="flex items-center gap-4">
          <span>📝 Will appear on photo DOP band</span>
          <span>📏 {value.length}/50 characters</span>
        </div>
        {value && (
          <div className="mt-1 p-2 bg-white border border-blue-200 rounded text-center">
            <span className="font-mono text-sm">Preview: {value}</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <p>💡 <strong>Tips:</strong></p>
        <ul className="ml-4 list-disc">
          <li>Use your full legal name as it appears on official documents</li>
          <li>Only letters and spaces are allowed</li>
          <li>Name will be automatically converted to UPPERCASE</li>
        </ul>
      </div>
    </div>
  );
}