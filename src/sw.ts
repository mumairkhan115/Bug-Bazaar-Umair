import { createCatalog } from './domain/catalog';
import { handleApi, toApiPath, type MockState } from './domain/api';
import {
  readStockTickRequest,
  readWatchIds,
  shouldPublishTick,
  stockChannelName,
  tickVisibleStock,
} from './domain/stockTick';

/**
 * Answers the API contract on GitHub Pages.
 *
 * Why: Pages only serves files. A request for `/api/products` at the domain
 * root is 404. This worker owns one catalog and responds under the site base.
 * A service worker timer does not keep the worker alive, so a closed tab
 * simply stops asking for the next stock step.
 */

interface WorkerClients {
  claim: () => Promise<void>;
}

interface WorkerScope {
  skipWaiting: () => void;
  clients: WorkerClients;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
}

interface FetchWorkerEvent extends Event {
  request: Request;
  respondWith: (response: Promise<Response> | Response) => void;
  waitUntil: (promise: Promise<unknown>) => void;
}

interface MessageWorkerEvent extends Event {
  data: unknown;
}

const scope = globalThis as unknown as WorkerScope;
const state: MockState = {
  products: createCatalog(),
  orders: new Map(),
  idempotency: new Map(),
};
const channel = new BroadcastChannel(stockChannelName);
let watched: string[] = [];
let lastTickAt = 0;

channel.addEventListener('message', (event) => {
  const ids = readWatchIds((event as MessageWorkerEvent).data);
  if (ids) {
    watched = ids;
  }
});

scope.addEventListener('message', (event) => {
  const tick = readStockTickRequest((event as MessageWorkerEvent).data);
  if (!tick) {
    return;
  }
  watched = tick.productIds;
  const now = Date.now();
  if (!shouldPublishTick(now, lastTickAt)) {
    return;
  }
  lastTickAt = now;
  publishTick();
});

scope.addEventListener('install', () => {
  scope.skipWaiting();
});

scope.addEventListener('activate', (event) => {
  (event as FetchWorkerEvent).waitUntil(scope.clients.claim());
});

scope.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchWorkerEvent;
  const pathname = toApiPath(new URL(fetchEvent.request.url).pathname);
  if (!pathname) {
    return;
  }
  fetchEvent.respondWith(answer(fetchEvent.request, pathname));
});

function publishTick(): void {
  const update = tickVisibleStock(state.products, watched);
  if (update) {
    channel.postMessage(update);
  }
}

async function answer(request: Request, pathname: string): Promise<Response> {
  try {
    const url = new URL(request.url);
    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await readJson(request);
    const result = handleApi(state, {
      method: request.method,
      pathname,
      searchParams: url.searchParams,
      body,
      authorization: request.headers.get('Authorization') ?? undefined,
      idempotencyKey: request.headers.get('Idempotency-Key') ?? undefined,
    });
    if (result.delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, result.delayMs);
      });
    }
    return jsonResponse(result.status, result.body);
  } catch {
    return jsonResponse(400, {
      error: { code: 'validation', message: 'Request body is not valid JSON.' },
    });
  }
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length === 0) {
    return {};
  }
  return JSON.parse(text) as unknown;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
