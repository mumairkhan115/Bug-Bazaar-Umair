import { useEffect } from 'react';
import { publishWatch } from '../services/stock/watchList';

/**
 * Tells the stock feed which products are on this page.
 *
 * React concept: the effect runs when the id list changes and does not
 * clear the list on unmount, so a route change replaces it instead of racing.
 * Why: live stock has to move a card the shopper can see.
 */
export function useWatchStock(ids: readonly string[]): void {
  const key = ids.join('\n');

  useEffect(() => {
    if (key === '') {
      return;
    }
    publishWatch(key.split('\n'));
  }, [key]);
}
