import { useEffect, useState } from 'react';
import { openStockSocket, type StockStatus, type StockUpdate } from '../services/stock/stockClient';

/**
 * Subscribes a page to live stock and disconnects on unmount.
 *
 * Why: the feed has to recover after a drop and stop when the shopper leaves.
 */
export function useStockFeed(onUpdate: (update: StockUpdate) => void) {
  const [status, setStatus] = useState<StockStatus>('connecting');

  useEffect(() => {
    return openStockSocket({
      onStatus: setStatus,
      onUpdate,
    });
  }, [onUpdate]);

  return status;
}
