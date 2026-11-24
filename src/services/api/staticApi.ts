import { handleApi, type ApiCall, type ApiResult, type MockState } from '../../domain/api';
import { createCatalog } from '../../domain/catalog';
import { tickVisibleStock } from '../../domain/stockTick';
import { getWatchedProducts } from '../stock/watchList';

let state: MockState | undefined;

/**
 * One in-memory shop for the static GitHub Pages build.
 *
 * Why: Pages cannot run the Vite server, and login, cart, and stock must share one catalog.
 */
function memory(): MockState {
  if (!state) {
    state = {
      products: createCatalog(),
      orders: new Map(),
      idempotency: new Map(),
    };
  }
  return state;
}

export function callStaticApi(call: ApiCall): ApiResult {
  return handleApi(memory(), call);
}

/**
 * Moves one visible product the same way the dev socket does.
 *
 * Why: the memory fallback has no WebSocket, and the open page still expects live stock.
 */
export function tickStaticStock(): { productId: string; stock: number } | undefined {
  return tickVisibleStock(memory().products, getWatchedProducts());
}
