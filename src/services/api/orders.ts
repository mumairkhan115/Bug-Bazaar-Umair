import type { Order } from '../../domain/types';
import { invalidateProductCache } from './cache';
import { apiRequest } from './client';

export interface NewOrderLine {
  productId: string;
  quantity: number;
}

/**
 * Checks out with an idempotency key and then drops cached product stock.
 *
 * Why: the same key makes a retry return the original order. Invalidating
 * the product cache is how the next visit sees the new stock.
 */
export async function createOrder(
  lines: NewOrderLine[],
  idempotencyKey: string,
): Promise<{ id: string; status: 'queued' }> {
  const order = await apiRequest<{ id: string; status: 'queued' }>('/api/orders', {
    method: 'POST',
    body: { lines },
    cache: false,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  invalidateProductCache();
  return order;
}

export function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${encodeURIComponent(id)}`, { signal, cache: false });
}
