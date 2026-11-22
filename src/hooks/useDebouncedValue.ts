import { useEffect, useState } from 'react';

/**
 * Returns a value that updates only after the caller stops changing it.
 *
 * React concept: useEffect schedules the update and clears the timer on cleanup.
 * Why: search should not write a history entry on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
