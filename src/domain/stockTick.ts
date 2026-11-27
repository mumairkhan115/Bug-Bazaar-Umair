import { queryProducts } from './catalog.ts';
import { defaultSort, type Product } from './types.ts';

export const stockChannelName = 'bug-bazaar-stock';

/**
 * How often local and deployed stock each take one step.
 *
 * Why: one interval keeps the Vite socket and the Pages page on the same cadence.
 */
export const stockTickGapMs = 1000;

/**
 * Shortest gap the Pages worker will publish.
 *
 * Why: the page asks on `stockTickGapMs`, and a second tab can ask in between.
 * Timer drift is a few hundred milliseconds, so this sits just under the page
 * interval and still drops a stacked request.
 */
export const stockTickMinGapMs = stockTickGapMs - 200;

let cursor = 0;

export interface StockTickRequest {
  type: 'stock-tick';
  productIds: string[];
}

/**
 * Reads a watch list from a socket or broadcast message.
 *
 * Why: the shop only renders one page. The feed should change a product
 * on that page instead of a random row among 5,000.
 */
export function readWatchIds(value: unknown): string[] | undefined {
  if (typeof value !== 'object' || value === null || !('productIds' in value)) {
    return undefined;
  }
  const ids = (value as { productIds?: unknown }).productIds;
  if (!Array.isArray(ids)) {
    return undefined;
  }
  return ids.filter((id): id is string => typeof id === 'string');
}

/**
 * Builds the message a page sends to wake the Pages worker.
 *
 * Why: the worker owns the catalog, and the visible ids have to travel with
 * the wake-up. A restarted worker has forgotten which cards are on screen.
 */
export function stockTickRequest(productIds: readonly string[]): StockTickRequest {
  return { type: 'stock-tick', productIds: [...productIds] };
}

/**
 * Reads a wake-up message from the page.
 *
 * Why: a watch-list broadcast is not a tick. Only this message should move stock.
 */
export function readStockTickRequest(value: unknown): StockTickRequest | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  if ((value as { type?: unknown }).type !== 'stock-tick') {
    return undefined;
  }
  const productIds = readWatchIds(value);
  if (!productIds) {
    return undefined;
  }
  return { type: 'stock-tick', productIds };
}

/**
 * Decides whether this wake-up is far enough from the previous one.
 *
 * JavaScript concept: `Date.now()` differences absorb clock drift between tabs.
 * Why: two open tabs must not step the same product twice as fast.
 */
export function shouldPublishTick(
  now: number,
  lastTickAt: number,
  gap = stockTickMinGapMs,
): boolean {
  return now - lastTickAt >= gap;
}

/**
 * Changes the next visible product by one step.
 *
 * JavaScript concept: the cursor walks the watched ids, then wraps.
 * Why: a random id almost never sits on the open page, so the grid
 * looked frozen while the feed was connected.
 */
export function tickVisibleStock(
  products: readonly Product[],
  preferredIds: readonly string[],
): { productId: string; stock: number } | undefined {
  const byId = new Map(products.map((product) => [product.id, product]));
  const preferred = preferredIds.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
  const pool =
    preferred.length > 0
      ? preferred
      : queryProducts(products, {
          search: '',
          category: '',
          inStock: false,
          sort: defaultSort,
          page: 1,
          pageSize: 24,
        }).items;

  if (pool.length === 0) {
    return undefined;
  }

  const product = pool[cursor % pool.length];
  cursor += 1;
  if (!product) {
    return undefined;
  }
  product.stock = (product.stock + 1) % 12;
  return { productId: product.id, stock: product.stock };
}
