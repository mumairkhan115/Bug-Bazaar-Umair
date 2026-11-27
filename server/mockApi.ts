import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { createCatalog } from '../src/domain/catalog.ts';
import { handleApi, toApiPath, type MockState } from '../src/domain/api.ts';
import { readWatchIds, stockTickGapMs, tickVisibleStock } from '../src/domain/stockTick.ts';

interface UpgradeServer {
  on(
    event: 'upgrade',
    listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void,
  ): void;
  prependListener?(
    event: 'upgrade',
    listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void,
  ): void;
  on(event: 'close', listener: () => void): void;
}

const attachedSockets = new WeakSet<UpgradeServer>();

function createState(): MockState {
  return {
    products: createCatalog(),
    orders: new Map(),
    idempotency: new Map(),
  };
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(text) as unknown;
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

/**
 * Serves `/api/*` from the shared contract during dev and preview.
 * Browser code reaches it with fetch. React components do not import it.
 */
function mockMiddleware(state: MockState) {
  return (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const pathname = toApiPath(url.pathname);
    if (!pathname) {
      next();
      return;
    }

    void (async () => {
      try {
        const method = request.method ?? 'GET';
        const body = method === 'GET' ? undefined : await readBody(request);
        const result = handleApi(state, {
          method,
          pathname,
          searchParams: url.searchParams,
          body,
          authorization: request.headers.authorization,
          idempotencyKey: headerValue(request.headers['idempotency-key']),
        });
        if (result.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, result.delayMs));
        }
        if (!response.writableEnded) {
          send(response, result.status, result.body);
        }
      } catch {
        if (!response.writableEnded) {
          send(response, 400, {
            error: { code: 'validation', message: 'Request body is not valid JSON.' },
          });
        }
      }
    })();
  };
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseWatchMessage(data: unknown): string[] | undefined {
  try {
    return readWatchIds(JSON.parse(messageText(data)) as unknown);
  } catch {
    return undefined;
  }
}

function messageText(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('utf8');
  }
  if (Array.isArray(data)) {
    const parts = data.filter((part): part is Buffer => Buffer.isBuffer(part));
    return Buffer.concat(parts).toString('utf8');
  }
  return '';
}

/**
 * Pushes stock changes to open catalog pages.
 * Upgrade events for Vite's own socket are left untouched.
 */
function attachStockSocket(httpServer: UpgradeServer, products: MockState['products']): void {
  if (attachedSockets.has(httpServer)) {
    return;
  }
  attachedSockets.add(httpServer);

  const sockets = new WebSocketServer({ noServer: true });
  const watchedByClient = new Map<WebSocket, readonly string[]>();
  const onUpgrade = (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const pathname = toApiPath(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (pathname !== '/api/stock') {
      return;
    }
    try {
      sockets.handleUpgrade(request, socket, head, (ws) => {
        sockets.emit('connection', ws, request);
      });
    } catch {
      // Leave Vite's own socket alone when this upgrade was already accepted.
    }
  };
  if (httpServer.prependListener) {
    httpServer.prependListener('upgrade', onUpgrade);
  } else {
    httpServer.on('upgrade', onUpgrade);
  }

  sockets.on('connection', (ws) => {
    ws.on('message', (data) => {
      const ids = parseWatchMessage(data);
      if (ids) {
        watchedByClient.set(ws, ids);
      }
    });
    ws.on('close', () => {
      watchedByClient.delete(ws);
    });
  });

  const timer = setInterval(() => {
    if (sockets.clients.size === 0 || products.length === 0) {
      return;
    }
    const watched = [...new Set([...watchedByClient.values()].flat())];
    const update = tickVisibleStock(products, watched);
    if (!update) {
      return;
    }
    const payload = JSON.stringify(update);
    for (const client of sockets.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }, stockTickGapMs);

  httpServer.on('close', () => {
    clearInterval(timer);
    sockets.close();
  });
}

function attach(server: ViteDevServer | PreviewServer, state: MockState): void {
  server.middlewares.use(mockMiddleware(state));
  if (server.httpServer) {
    attachStockSocket(server.httpServer, state.products);
  }
}

export function bugBazaarApi(): Plugin {
  const state = createState();
  return {
    name: 'bug-bazaar-api',
    configureServer(server) {
      attach(server, state);
    },
    configurePreviewServer(server) {
      attach(server, state);
    },
  };
}
