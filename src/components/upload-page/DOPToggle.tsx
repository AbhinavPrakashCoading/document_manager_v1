'use client';

import { useState } from 'react';
import { DOPDatePicker } from './DOPDatePicker';

interface DOPToggleProps {
  onDOPChange: (date: string | null, enabled: boolean, addBand?: boolean) => void;
  initialDate?: string;
  suggestedDate?: string;
  fieldType: string;
  userName?: string;
}

export function DOPToggle({ onDOPChange, initialDate, suggestedDate, fieldType, userName }: DOPToggleProps) {
  const [enabled, setEnabled] = useState(!!initialDate);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [addBand, setAddBand] = useState(true); // Default to adding band

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    
    if (newEnabled) {
      setShowPicker(true);
    } else {
      setSelectedDate('');
      onDOPChange(null, false);
    }
  };

  const handleDateConfirm = (date: string) => {
    setSelectedDate(date);
    setShowPicker(false);
    onDOPChange(date, true, addBand);
  };

  const handleDateCancel = () => {
    setShowPicker(false);
    if (!selectedDate) {
      setEnabled(false);
      onDOPChange(null, false, false);
    }
  };

  const handleBandToggle = (newAddBand: boolean) => {
    setAddBand(newAddBand);
    if (selectedDate && enabled) {
      onDOPChange(selectedDate, true, newAddBand);
    }
  };

  // Only show for photo-related fields
  if (!fieldType.toLowerCase().includes('photo')) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-gray-700">Add Date of Photography</span>
      </label>
      
      {enabled && selectedDate && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            📅 {new Date(selectedDate).toLocaleDateString()}
          </span>
          {addBand && userName && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              🖼️ Band: {userName}
            </span>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Change
          </button>
        </div>
      )}

      {enabled && selectedDate && (
        <div className="mt-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={addBand}
              onChange={(e) => handleBandToggle(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Add DOP band to photo</span>
            {!userName && (
              <span className="text-red-500">(Name required)</span>
            )}
          </label>
          {addBand && (
            <p className="text-xs text-gray-500 mt-1 ml-5">
              Will add a black bar with your name and date to the bottom of the photo
            </p>
          )}
        </div>
      )}

      {showPicker && (
        <DOPDatePicker
          onConfirm={handleDateConfirm}
          onCancel={handleDateCancel}
          initialDate={selectedDate}
          suggestedDate={suggestedDate}
        />
      )}
    </div>
  );
}