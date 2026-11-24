import { queryProducts } from './catalog.ts';
import type { Product } from './types.ts';

export const stockChannelName = 'bug-bazaar-stock';

let cursor = 0;

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
          sort: 'name',
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
