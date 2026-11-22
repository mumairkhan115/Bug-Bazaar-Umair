const entries: string[] = [];

/**
 * Records an unexpected error for the monitoring lesson.
 *
 * Why: a fallback screen is not enough. The team also needs a log entry
 * that a later service could ship off the page.
 */
export function logError(error: unknown, context = 'error'): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const entry = `${new Date().toISOString()} ${context} ${message}`;
  entries.push(entry);
  console.error(entry);
}

export function readLogs(): readonly string[] {
  return entries;
}
