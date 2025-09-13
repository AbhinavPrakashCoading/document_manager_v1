import registry from '@/schemas/ssc.json';
import fs from 'fs';
import path from 'path';

export function getCurrentSchema() {
  return registry.versions.find((v) => v.version === registry.defaultVersion);
}

export function rollbackToFallback() {
  const updated = {
    ...registry,
    defaultVersion: 'fallback',
    versions: [...registry.versions, { version: 'fallback', ...registry.fallback }],
  };

  const registryPath = path.resolve(process.cwd(), 'src/schemas/ssc.json');
  fs.writeFileSync(registryPath, JSON.stringify(updated, null, 2));

  console.log(`[REGISTRY] Rolled back to fallback schema`);
}