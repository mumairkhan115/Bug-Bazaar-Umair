import { handleApi, type ApiCall, type ApiResult, type MockState } from '../../domain/api';
import { createCatalog } from '../../domain/catalog';

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
 * Moves one product's stock the same way the dev socket does.
 *
 * Why: the public site has no WebSocket server, but product pages still expect live updates.
 */
export function tickStaticStock(): { productId: string; stock: number } | undefined {
  const products = memory().products;
  if (products.length === 0) {
    return undefined;
  }
  const index =
    Math.random() < 0.75
      ? Math.floor(Math.random() * Math.min(24, products.length))
      : Math.floor(Math.random() * products.length);
  const product = products[index];
  if (!product) {
    return undefined;
  }
  product.stock = Math.floor(Math.random() * 15);
  return { productId: product.id, stock: product.stock };
}
