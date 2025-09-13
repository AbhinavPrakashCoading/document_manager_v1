'use client';

import { useState } from 'react';
import registry from '@/schemas/ssc.json';

export function RegistryDashboard() {
  const versions = registry.versions || [];
  const fallback = registry.fallback;
  const [selectedVersion, setSelectedVersion] = useState(registry.defaultVersion);

  const current = versions.find((v) => v.version === selectedVersion);

  const diff = (a: any, b: any) => {
    const changes: Record<string, string[]> = {};
    for (const key of Object.keys(a)) {
      const aVal = JSON.stringify(a[key]);
      const bVal = JSON.stringify(b[key]);
      if (aVal !== bVal) {
        changes[key] = [`🔄 ${aVal}`, `🛡️ ${bVal}`];
      }
    }
    return changes;
  };

  const changes = current ? diff(current, fallback) : {};

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">📚 SSC Schema Registry</h2>

      <div className="space-y-2">
        <label className="text-sm">Select Version:</label>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              {v.version}
            </option>
          ))}
        </select>
      </div>

      {current && (
        <div className="border p-4 rounded shadow-sm space-y-2">
          <h3 className="font-medium text-blue-600">📦 Version: {current.version}</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>📷 Photo: {current.photo.format}, {current.photo.maxSizeKB}KB, {current.photo.dimensions}</li>
            <li>✍️ Signature: {current.signature.format}, {current.signature.maxSizeKB}KB, {current.signature.dimensions}</li>
            <li>📄 Documents: {current.documents.required.join(', ') || 'None'}</li>
          </ul>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-700">🛡️ Fallback Schema</summary>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          <p>📷 Photo: {fallback.photo.format}, {fallback.photo.maxSizeKB}KB, {fallback.photo.dimensions}</p>
          <p>✍️ Signature: {fallback.signature.format}, {fallback.signature.maxSizeKB}KB, {fallback.signature.dimensions}</p>
          <p>📄 Documents: {fallback.documents.required.join(', ') || 'None'}</p>
        </div>
      </details>

      {Object.keys(changes).length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-red-600">🔍 Differences from Fallback</h4>
          <ul className="text-xs text-gray-700 list-disc ml-4">
            {Object.entries(changes).map(([key, [a, b]]) => (
              <li key={key}>
                <strong>{key}</strong>: {a} → {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="mt-6 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
        onClick={() => alert('Rollback stub — not wired yet')}
      >
        ⏪ Rollback to Fallback
      </button>
    </div>
  );
}