import { stockChannelName } from '../../domain/stockTick';
import { staticTransport, usesStaticApi } from '../api/mode';
import { getWatchedProducts, subscribeWatch } from './watchList';

export interface StockUpdate {
  productId: string;
  stock: number;
}

export type StockStatus = 'connecting' | 'live' | 'reconnecting' | 'closed';

interface StockHandlers {
  onStatus: (status: StockStatus) => void;
  onUpdate: (update: StockUpdate) => void;
}

/**
 * Opens the stock feed and reconnects until the page cleanup runs.
 *
 * React concept: the returned function is the only thing that may stop the feed.
 * Why: a closed tab must not keep reconnecting, and a dropped socket must come back.
 */
export function openStockSocket(handlers: StockHandlers): () => void {
  if (!usesStaticApi()) {
    return openDevSocket(handlers);
  }
  if (staticTransport() === 'worker') {
    return openWorkerStock(handlers);
  }
  return openStaticStock(handlers);
}

function openDevSocket(handlers: StockHandlers): () => void {
  let stopped = false;
  let socket: WebSocket | null = null;
  let timer = 0;
  let attempt = 0;

  const sendWatch = (ids: readonly string[]) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ productIds: ids }));
    }
  };
  const stopWatch = subscribeWatch(sendWatch);

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
      sendWatch(getWatchedProducts());
    });
    socket.addEventListener('message', (event) => {
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
    stopWatch();
    window.clearTimeout(timer);
    socket?.close();
    handlers.onStatus('closed');
  };
}

/**
 * Listens to the Pages worker, which owns the catalog on that host.
 *
 * Why: GitHub Pages cannot upgrade a WebSocket. The worker pushes the same payload.
 */
function openWorkerStock(handlers: StockHandlers): () => void {
  let stopped = false;
  const channel = new BroadcastChannel(stockChannelName);
  handlers.onStatus('live');

  const sendWatch = (ids: readonly string[]) => {
    channel.postMessage({ productIds: ids });
  };
  const stopWatch = subscribeWatch(sendWatch);
  sendWatch(getWatchedProducts());

  channel.addEventListener('message', (event) => {
    if (stopped) {
      return;
    }
    const update = parseUpdate(event.data);
    if (update) {
      handlers.onUpdate(update);
    }
  });

  return () => {
    stopped = true;
    stopWatch();
    channel.close();
    handlers.onStatus('closed');
  };
}

/**
 * Publishes stock ticks in the page when the worker did not take control.
 *
 * Why: the shop still has to move stock if registration fails.
 */
function openStaticStock(handlers: StockHandlers): () => void {
  let stopped = false;
  handlers.onStatus('live');
  const timer = window.setInterval(() => {
    if (stopped) {
      return;
    }
    void import('../api/staticApi').then(({ tickStaticStock }) => {
      if (stopped) {
        return;
      }
      const update = tickStaticStock();
      if (update) {
        handlers.onUpdate(update);
      }
    });
  }, 4000);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    handlers.onStatus('closed');
  };
}

function parseUpdate(raw: unknown): StockUpdate | undefined {
  try {
    const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
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
