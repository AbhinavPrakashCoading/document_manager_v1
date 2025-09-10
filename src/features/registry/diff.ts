export function diffSchemas(a: any, b: any): Record<string, string[]> {
  const changes: Record<string, string[]> = {};

  for (const key of Object.keys(a)) {
    const aVal = JSON.stringify(a[key]);
    const bVal = JSON.stringify(b[key]);

    if (aVal !== bVal) {
      changes[key] = [`🔄 ${aVal}`, `🛡️ ${bVal}`];
    }
  }

  return changes;
}