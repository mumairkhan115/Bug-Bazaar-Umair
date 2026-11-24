import { createContext, useContext } from 'react';
import type { StockStatus } from '../../../services/stock/stockClient';

export interface LiveStock {
  status: StockStatus;
  stocks: Record<string, number>;
}

const defaultLiveStock: LiveStock = {
  status: 'connecting',
  stocks: {},
};

export const LiveStockContext = createContext<LiveStock>(defaultLiveStock);

/** Reads the shell's stock feed. The layout owns the socket. */
export function useLiveStock(): LiveStock {
  return useContext(LiveStockContext);
}
