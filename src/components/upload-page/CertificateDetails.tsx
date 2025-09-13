'use client';

export function CertificateDetails({ type }: { type: string }) {
  if (type === 'idProof') {
    return (
      <select className="text-sm border rounded px-2 py-1 mb-2 w-full">
        <option value="">Select ID Type</option>
        <option value="aadhaar">Aadhaar</option>
        <option value="passport">Passport</option>
        <option value="voter">Voter ID</option>
      </select>
    );
  }

  if (type === 'ageProof') {
    return (
      <select className="text-sm border rounded px-2 py-1 mb-2 w-full">
        <option value="">Select Age Document</option>
        <option value="birth">Birth Certificate</option>
        <option value="10th">Class 10 Marksheet</option>
      </select>
    );
  }

  if (type === 'educationCertificate') {
    return (
      <select className="text-sm border rounded px-2 py-1 mb-2 w-full">
        <option value="">Select Education Level</option>
        <option value="class10">Class 10</option>
        <option value="class12">Class 12</option>
        <option value="graduation">Graduation</option>
        <option value="postgrad">Post-Graduation</option>
      </select>
    );
  }

  return null;
}
