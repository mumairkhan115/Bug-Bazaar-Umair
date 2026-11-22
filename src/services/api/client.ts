import { readCache, writeCache } from './cache';
import { ApiRequestError, toApiRequestError } from './errors';

type UnauthorizedHandler = () => void;

let readToken: () => string | null = () => null;
let handleUnauthorized: UnauthorizedHandler = () => {};

/**
 * Connects the fetch client to the Redux session without a circular import.
 *
 * Why: the client must attach the token and clear it on 401, and the store
 * must not import the client while the client imports the store.
 */
export function configureApi(options: {
  readToken: () => string | null;
  onUnauthorized: () => void;
}): void {
  readToken = options.readToken;
  handleUnauthorized = options.onUnauthorized;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  cache?: boolean;
  headers?: Record<string, string>;
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

/**
 * Sends every application request through one function.
 *
 * React concept: callers pass an AbortSignal from useEffect cleanup.
 * Why: components must not call fetch themselves, so status handling stays consistent.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const cacheable = method === 'GET' && options.cache !== false;

  if (cacheable) {
    const cached = readCache<T>(path);
    if (cached !== undefined) {
      return cached;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  const token = readToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw toApiRequestError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T;
  if (cacheable) {
    writeCache(path, data);
  }
  return data;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export { ApiRequestError };
