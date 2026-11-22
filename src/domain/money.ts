/**
 * Formats an integer cent price for display.
 *
 * JavaScript concept: Intl.NumberFormat avoids hand-rolled decimal rounding.
 * Why: the API stores cents, and the screen must show dollars.
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
