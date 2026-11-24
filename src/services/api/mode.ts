let transport: 'worker' | 'memory' = 'memory';

/**
 * Pages cannot run the Vite server. Dev and preview still can.
 *
 * Why: a fetch to `https://user.github.io/api/...` drops the repository
 * folder and GitHub returns 404. The worker answers the same path under the site base.
 */
export function usesStaticApi(): boolean {
  if (import.meta.env.VITE_STATIC_API === 'true') {
    return true;
  }
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');
}

export function staticTransport(): 'worker' | 'memory' {
  return transport;
}

/**
 * Joins the site base and a contract path.
 *
 * JavaScript concept: `URL` resolves `api/products` against the base, so a
 * product route cannot be treated as the parent folder.
 */
export function joinBasePath(origin: string, base: string, path: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const relative = path.startsWith('/') ? path.slice(1) : path;
  return new URL(relative, `${origin}${prefix}`).href;
}

export function staticApiUrl(path: string): string {
  return joinBasePath(window.location.origin, import.meta.env.BASE_URL, path);
}

/**
 * Registers the Pages worker before the first catalog request.
 *
 * Why: if React fetches first, GitHub answers `/api` with the SPA 404 page.
 * A failed registration falls back to the in-memory contract so the shop still opens.
 */
export async function prepareStaticApi(): Promise<void> {
  if (!usesStaticApi() || !('serviceWorker' in navigator)) {
    transport = 'memory';
    return;
  }

  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      type: 'module',
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    });
    await waitForController();
    transport = navigator.serviceWorker.controller ? 'worker' : 'memory';
  } catch {
    transport = 'memory';
  }
}

function waitForController(): Promise<void> {
  if (navigator.serviceWorker.controller) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', finish);
      resolve();
    };
    const timer = window.setTimeout(finish, 4000);
    navigator.serviceWorker.addEventListener('controllerchange', finish);
  });
}
