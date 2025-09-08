import { SchemaRegistry } from './types';
import { fallbackRequirements } from './fallback';

export const sscRegistry: SchemaRegistry = {
  institution: 'ssc',
  defaultVersion: '2025.1',
  versions: [
    {
      version: '2025.1',
      lastUpdated: '2025-09-08',
      source: 'ssc-guidelines',
      requirements: {
        photo: {
          type: 'Photo',
          format: ['jpg', 'jpeg'],
          maxSizeKB: 50,
          dimensions: {
            width: { min: 100, max: 120 },
            height: { min: 100, max: 150 }
          },
          backgroundColor: 'white',
          namingConvention: 'photo.jpg',
          additional: [
            'Recent passport size color photograph (not more than 3 months old)',
            'Clear facial features',
            'Neutral facial expression',
            'Both ears visible',
            'Light colored background'
          ]
        },
        signature: {
          type: 'Signature',
          format: ['jpg', 'jpeg'],
          maxSizeKB: 30,
          dimensions: {
            width: { min: 140, max: 160 },
            height: { min: 60, max: 80 }
          },
          backgroundColor: 'white',
          namingConvention: 'sign.jpg',
          additional: [
            'On white paper with black ink',
            'Must be clear and visible',
            'No overlapping'
          ]
        },
        documents: {
          type: 'Documents',
          format: ['pdf'],
          maxSizeKB: 2048,
          namingConvention: '{document_name}.pdf',
          required: [
            'Age Proof Certificate',
            'Educational Qualification Certificates',
            'Caste Certificate (if applicable)',
            'Category Certificate (if applicable)',
            'Experience Certificate (if applicable)'
          ]
        }
      }
    }
  ],
  fallback: fallbackRequirements.fallback
};
