import { authenticate, userForToken } from './auth.ts';
import { delayFor, parseProductQuery, queryProducts } from './catalog.ts';
import { placeOrder, type OrderDraftLine, type OrderState } from './orders.ts';
import type { ApiErrorBody, Product } from './types.ts';

export interface MockState extends OrderState {
  products: Product[];
}

export interface ApiCall {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  body: unknown;
  authorization?: string;
  idempotencyKey?: string;
}

export interface ApiResult {
  status: number;
  body: unknown;
  delayMs: number;
}

export function errorBody(
  code: string,
  message: string,
  details?: Record<string, string>,
): ApiErrorBody {
  return { error: { code, message, details } };
}

function bearerToken(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  return authorization.slice('Bearer '.length);
}

/**
 * Implements the shared HTTP contract in memory.
 *
 * Why: every screen calls this contract, and tests can trigger each status
 * without starting Vite. Components never import this function.
 */
export function handleApi(state: MockState, call: ApiCall): ApiResult {
  const delayMs =
    call.searchParams.get('delay') === '1' ? delayFor(call.searchParams.get('search') ?? '') : 0;
  const { method, pathname } = call;

  if (method === 'GET' && pathname === '/api/products') {
    if ((call.searchParams.get('search') ?? '') === '__error_500') {
      return { status: 500, delayMs, body: errorBody('unavailable', 'Service unavailable') };
    }
    return {
      status: 200,
      delayMs,
      body: queryProducts(state.products, parseProductQuery(call.searchParams)),
    };
  }

  if (method === 'GET' && pathname.startsWith('/api/products/')) {
    const id = pathname.slice('/api/products/'.length);
    if (id === '__error_500') {
      return { status: 500, delayMs: 0, body: errorBody('unavailable', 'Service unavailable') };
    }
    const product = state.products.find((item) => item.id === id);
    if (!product) {
      return { status: 404, delayMs: 0, body: errorBody('not_found', 'Product not found') };
    }
    return { status: 200, delayMs: 0, body: product };
  }

  if (method === 'POST' && pathname === '/api/login') {
    const body = isRecord(call.body) ? call.body : {};
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const result = authenticate(email, password);
    if (!result.ok && result.status === 400) {
      return {
        status: 400,
        delayMs: 0,
        body: errorBody('validation', 'Check the form.', result.details),
      };
    }
    if (!result.ok) {
      return {
        status: 401,
        delayMs: 0,
        body: errorBody('unauthorized', 'Invalid email or password'),
      };
    }
    return { status: 200, delayMs: 0, body: { token: result.token, user: result.user } };
  }

  if (method === 'GET' && pathname === '/api/me') {
    const user = userForToken(bearerToken(call.authorization));
    if (!user) {
      return { status: 401, delayMs: 0, body: errorBody('unauthorized', 'Sign in required') };
    }
    return { status: 200, delayMs: 0, body: user };
  }

  if (method === 'POST' && pathname === '/api/orders') {
    const user = userForToken(bearerToken(call.authorization));
    if (!user) {
      return { status: 401, delayMs: 0, body: errorBody('unauthorized', 'Sign in required') };
    }
    const lines = readLines(call.body);
    const result = placeOrder(state, { lines, idempotencyKey: call.idempotencyKey ?? '' });
    if (!result.ok && result.status === 409) {
      return {
        status: 409,
        delayMs: 0,
        body: errorBody('out_of_stock', 'Out of stock', result.details),
      };
    }
    if (!result.ok) {
      return {
        status: 400,
        delayMs: 0,
        body: errorBody('validation', 'Check the order.', result.details),
      };
    }
    return { status: 201, delayMs: 0, body: { id: result.order.id, status: result.order.status } };
  }

  if (method === 'GET' && pathname.startsWith('/api/orders/')) {
    const user = userForToken(bearerToken(call.authorization));
    if (!user) {
      return { status: 401, delayMs: 0, body: errorBody('unauthorized', 'Sign in required') };
    }
    const order = state.orders.get(pathname.slice('/api/orders/'.length));
    if (!order) {
      return { status: 404, delayMs: 0, body: errorBody('not_found', 'Order not found') };
    }
    return { status: 200, delayMs: 0, body: order };
  }

  return { status: 404, delayMs: 0, body: errorBody('not_found', 'Route not found') };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readLines(body: unknown): OrderDraftLine[] {
  if (!isRecord(body) || !Array.isArray(body.lines)) {
    return [];
  }
  return body.lines.flatMap((line) => {
    if (
      !isRecord(line) ||
      typeof line.productId !== 'string' ||
      typeof line.quantity !== 'number'
    ) {
      return [];
    }
    return [{ productId: line.productId, quantity: line.quantity }];
  });
}
