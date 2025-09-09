'use client';

import registry from '@/schemas/ssc.json';

export function RegistryDashboard() {
  const versions = registry.versions || [];
  const fallback = registry.fallback;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📚 SSC Schema Registry</h2>

      <div className="space-y-4">
        {versions.map((v) => (
          <div key={v.version} className="border p-4 rounded shadow-sm">
            <h3 className="font-medium text-blue-600">Version: {v.version}</h3>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>📷 Photo: {v.photo.format}, {v.photo.maxSizeKB}KB, {v.photo.dimensions}</li>
              <li>✍️ Signature: {v.signature.format}, {v.signature.maxSizeKB}KB, {v.signature.dimensions}</li>
              <li>📄 Documents: {v.documents.required.join(', ') || 'None'}</li>
            </ul>
          </div>
        ))}
      </div>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600">🛡️ Fallback Schema</summary>
        <div className="mt-2 text-sm text-gray-700">
          <p>📷 Photo: {fallback.photo.format}, {fallback.photo.maxSizeKB}KB, {fallback.photo.dimensions}</p>
          <p>✍️ Signature: {fallback.signature.format}, {fallback.signature.maxSizeKB}KB, {fallback.signature.dimensions}</p>
          <p>📄 Documents: {fallback.documents.required.join(', ') || 'None'}</p>
        </div>
      </details>
    </div>
  );
}