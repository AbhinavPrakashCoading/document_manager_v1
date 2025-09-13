'use client';

import { useState, useEffect } from 'react';

interface DOPDatePickerProps {
  onConfirm: (date: string) => void;
  onCancel: () => void;
  initialDate?: string;
  suggestedDate?: string;
}

export function DOPDatePicker({ onConfirm, onCancel, initialDate, suggestedDate }: DOPDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) return initialDate;
    if (suggestedDate) return suggestedDate;
    
    // Default to 6 months ago as photos should be recent
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo.toISOString().split('T')[0];
  });

  // Get today's date for max constraint
  const today = new Date().toISOString().split('T')[0];
  
  // Get date 2 years ago for min constraint (reasonable limit for document photos)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const minDate = twoYearsAgo.toISOString().split('T')[0];

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  const generateSuggestions = () => {
    const suggestions = [];
    const now = new Date();
    
    // Recent dates (good for most documents)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    suggestions.push({
      label: '1 month ago',
      date: oneMonthAgo.toISOString().split('T')[0],
      reason: 'Recent (recommended)'
    });
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    suggestions.push({
      label: '3 months ago',
      date: threeMonthsAgo.toISOString().split('T')[0],
      reason: 'Acceptable for most exams'
    });
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    suggestions.push({
      label: '6 months ago',
      date: sixMonthsAgo.toISOString().split('T')[0],
      reason: 'Maximum for most requirements'
    });
    
    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Set Date of Photography</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When was this photo taken?
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            max={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Date must be between {new Date(minDate).toLocaleDateString()} and today
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
          <div className="space-y-1">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(suggestion.date)}
                className={`w-full text-left px-3 py-2 text-sm rounded border transition-colors ${
                  selectedDate === suggestion.date
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{suggestion.label}</span>
                <span className="text-gray-500 ml-2">({suggestion.reason})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Date
          </button>
        </div>
      </div>
    </div>
  );
}