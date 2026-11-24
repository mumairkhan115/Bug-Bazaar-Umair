let current: readonly string[] = [];
let key = '';
const listeners = new Set<(ids: readonly string[]) => void>();

/**
 * Remembers which products are on screen and tells the open feed.
 *
 * Why: the socket and the Pages worker both need the same id list,
 * and the page that owns the cards should be the only writer.
 */
export function publishWatch(ids: readonly string[]): void {
  const nextKey = ids.join('\n');
  if (nextKey === key) {
    return;
  }
  key = nextKey;
  current = [...ids];
  for (const listener of listeners) {
    listener(current);
  }
}

export function getWatchedProducts(): readonly string[] {
  return current;
}

export function subscribeWatch(listener: (ids: readonly string[]) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
