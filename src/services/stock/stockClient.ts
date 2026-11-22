export interface StockUpdate {
  productId: string;
  stock: number;
}

export type StockStatus = 'connecting' | 'live' | 'reconnecting' | 'closed';

/**
 * Opens the stock socket and reconnects with backoff until stopped.
 *
 * React concept: the cleanup function is the only thing that may set `stopped`.
 * Why: a closed product page must not keep reconnecting in the background.
 */
export function openStockSocket(handlers: {
  onStatus: (status: StockStatus) => void;
  onUpdate: (update: StockUpdate) => void;
}): () => void {
  let stopped = false;
  let socket: WebSocket | null = null;
  let timer = 0;
  let attempt = 0;

  const connect = () => {
    if (stopped) {
      return;
    }
    handlers.onStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${protocol}://${window.location.host}/api/stock`);
    socket.addEventListener('open', () => {
      attempt = 0;
      handlers.onStatus('live');
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return;
      }
      const update = parseUpdate(event.data);
      if (update) {
        handlers.onUpdate(update);
      }
    });
    socket.addEventListener('close', () => {
      if (stopped) {
        return;
      }
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      attempt += 1;
      timer = window.setTimeout(connect, delay);
    });
  };

  connect();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    socket?.close();
    handlers.onStatus('closed');
  };
}

function parseUpdate(raw: string): StockUpdate | undefined {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.productId !== 'string' || typeof record.stock !== 'number') {
      return undefined;
    }
    return { productId: record.productId, stock: record.stock };
  } catch {
    return undefined;
  }
}
