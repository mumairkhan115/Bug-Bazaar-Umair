import type { Order, OrderLine, Product } from './types.ts';

export interface OrderDraftLine {
  productId: string;
  quantity: number;
}

export interface OrderState {
  products: Product[];
  orders: Map<string, Order>;
  idempotency: Map<string, string>;
}

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: 400; details: Record<string, string> }
  | { ok: false; status: 409; details: Record<string, string> };

/**
 * Places an order once per idempotency key and decrements stock.
 *
 * Why: a retried checkout must not create a second order or charge twice.
 * The key is stored with the first successful order and reused on purpose.
 */
export function placeOrder(
  state: OrderState,
  input: { lines: OrderDraftLine[]; idempotencyKey: string },
): PlaceOrderResult {
  const existingId = state.idempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = state.orders.get(existingId);
    if (existing) {
      return { ok: true, order: existing };
    }
  }

  if (input.idempotencyKey.trim().length === 0) {
    return { ok: false, status: 400, details: { idempotencyKey: 'Missing checkout key.' } };
  }

  if (input.lines.length === 0) {
    return { ok: false, status: 400, details: { lines: 'Add at least one item.' } };
  }

  const resolved: OrderLine[] = [];

  for (const line of input.lines) {
    const product = state.products.find((item) => item.id === line.productId);
    if (!product) {
      return { ok: false, status: 400, details: { productId: 'Unknown product.' } };
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, status: 400, details: { quantity: 'Quantity must be at least 1.' } };
    }
    if (line.quantity > product.stock) {
      return {
        ok: false,
        status: 409,
        details: { productId: product.id, productName: product.name },
      };
    }
    resolved.push({ productId: product.id, name: product.name, quantity: line.quantity });
  }

  for (const line of resolved) {
    const product = state.products.find((item) => item.id === line.productId);
    if (product) {
      product.stock -= line.quantity;
    }
  }

  const order: Order = {
    id: `ord-${state.orders.size + 1}`,
    status: 'queued',
    lines: resolved,
  };
  state.orders.set(order.id, order);
  state.idempotency.set(input.idempotencyKey, order.id);
  return { ok: true, order };
}
