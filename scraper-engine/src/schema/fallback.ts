import { SchemaRegistry } from './types';

// Standard fallback requirements that work for most institutions
export const fallbackRequirements: SchemaRegistry = {
  institution: 'generic',
  defaultVersion: '1.0.0',
  versions: [
    {
      version: '1.0.0',
      lastUpdated: '2025-09-08',
      source: 'standard-guidelines',
      requirements: {
        photo: {
          type: 'Photo',
          format: ['jpg', 'jpeg'],
          maxSizeKB: 100,
          dimensions: {
            width: { min: 100, max: 150 },
            height: { min: 120, max: 170 }
          },
          backgroundColor: 'white',
          namingConvention: 'photo.jpg',
          additional: [
            'Recent passport size photograph',
            'Clear face visibility',
            'Neutral expression',
            'Plain background'
          ]
        },
        signature: {
          type: 'Signature',
          format: ['jpg', 'jpeg'],
          maxSizeKB: 50,
          dimensions: {
            width: { min: 140, max: 160 },
            height: { min: 60, max: 80 }
          },
          backgroundColor: 'white',
          namingConvention: 'sign.jpg',
          additional: [
            'Clear signature on white paper',
            'Black or blue ink only',
            'Within specified dimensions'
          ]
        },
        documents: {
          type: 'Documents',
          format: ['pdf'],
          maxSizeKB: 1024,
          namingConvention: '{document_name}.pdf',
          required: [
            'Identity Proof',
            'Address Proof',
            'Educational Certificates',
            'Category Certificate (if applicable)'
          ]
        }
      }
    }
  ],
  fallback: {
    version: '1.0.0',
    lastUpdated: '2025-09-08',
    source: 'fallback-guidelines',
    requirements: {
      photo: {
        type: 'Photo',
        format: ['jpg', 'jpeg', 'png'],
        maxSizeKB: 200,
        dimensions: {
          width: { min: 100, max: 200 },
          height: { min: 120, max: 200 }
        },
        backgroundColor: 'white',
        namingConvention: 'photo.{ext}',
        additional: [
          'Clear photograph',
          'Visible face',
          'Recent photo'
        ]
      },
      signature: {
        type: 'Signature',
        format: ['jpg', 'jpeg', 'png'],
        maxSizeKB: 100,
        dimensions: {
          width: { min: 100, max: 200 },
          height: { min: 50, max: 100 }
        },
        backgroundColor: 'white',
        namingConvention: 'sign.{ext}',
        additional: [
          'Clear signature',
          'On white background'
        ]
      },
      documents: {
        type: 'Documents',
        format: ['pdf', 'jpg', 'jpeg'],
        maxSizeKB: 2048,
        namingConvention: '{document_name}.{ext}',
        required: [
          'Identity Document',
          'Educational Document'
        ]
      }
    }
  }
};
