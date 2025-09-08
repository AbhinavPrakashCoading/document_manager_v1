export const SSCConfig = {
  url: 'https://ssc.nic.in/document-requirements',
  selectors: {
    photo: '#photo-requirement',
    signature: '#signature-requirement',
  },
  expected: {
    format: 'JPEG',
    maxSizeKB: 50,
    dimensions: '200x300',
  },
};
