const entries = new Map<string, unknown>();

/**
 * Remembers successful GET responses for the current tab.
 *
 * Why: walking back to a page should not refetch data the store already has.
 * Stock can be stale until an order invalidates these entries.
 */
export function readCache<T>(key: string): T | undefined {
  if (!entries.has(key)) {
    return undefined;
  }
  return entries.get(key) as T;
}

export function writeCache(key: string, value: unknown): void {
  entries.set(key, value);
}

export function invalidateProductCache(): void {
  for (const key of entries.keys()) {
    if (key.startsWith('/api/products')) {
      entries.delete(key);
    }
  }
}

export function clearCache(): void {
  entries.clear();
}
