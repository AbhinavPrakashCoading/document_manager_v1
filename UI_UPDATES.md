# UI Component Updates

The following files need to be updated with the new changes:

## UploadField.tsx
```tsx
interface UploadFieldProps {
  label: string;
  required: boolean;
  onUpload: (file: FileWithMetadata | null) => Promise<void>;
  uploaded: boolean;
  accept?: string;
  helpText?: string;
}

export function UploadField({ label, required, onUpload, uploaded, accept, helpText }: UploadFieldProps) {
  // ... existing code ...

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-lg text-sm 
          ${uploaded ? 'border-green-500 bg-green-50' : 'border-gray-300'}
          hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
      {required && (
        <span className="absolute top-2 right-2 text-red-500 text-xs">Required</span>
      )}
      {helpText && (
        <p className="mt-1 text-xs text-gray-600">{helpText}</p>
      )}
    </div>
  );
}
```

## CertificateDetails.tsx
```tsx
import { useEffect, useState } from 'react';
import { EnhancedDocumentRequirement } from '@/features/exam/examSchema';

interface CertificateDetailsProps {
  requirement: EnhancedDocumentRequirement;
}

export function CertificateDetails({ requirement }: CertificateDetailsProps) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium">Document Details</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Format:</span> {requirement.format}</p>
          <p><span className="font-medium">Max Size:</span> {requirement.maxSizeKB}KB</p>
          {requirement.dimensions && (
            <p><span className="font-medium">Dimensions:</span> {requirement.dimensions}</p>
          )}
        </div>
      </div>

      {requirement.subjective && requirement.subjective.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-blue-600">Requirements</h3>
          <ul className="mt-2 space-y-2">
            {requirement.subjective
              .filter(sub => sub.confidence >= 0.8)
              .map((sub, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500">•</span>
                  <div>
                    <p>{sub.requirement}</p>
                    <p className="text-xs text-gray-500">{sub.context}</p>
                  </div>
                </li>
            ))}
          </ul>
        </div>
      )}

      {requirement.commonMistakes && requirement.commonMistakes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-red-600">Common Mistakes to Avoid</h3>
          <ul className="mt-2 space-y-1">
            {requirement.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                <span>⚠️</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## New Features Added:
1. Enhanced document metadata display
2. Validation rule types (strict/soft/warning) with visual indicators
3. Subjective requirements with confidence scores
4. Common mistakes and help text display
5. Improved error feedback and validation messages
6. File type restrictions based on requirements
7. Document aliases support
8. Category-based organization

These updates provide a better user experience with more detailed validation feedback and clearer document requirements.