import { useCallback, useEffect, useState } from 'react';
import type { ProductPage, ProductQuery, RequestStatus } from '../domain/types';
import { friendlyMessage } from '../services/api/errors';
import { isAbortError } from '../services/api/client';
import { listProducts } from '../services/api/products';

interface Snapshot {
  key: string;
  status: RequestStatus;
  page: ProductPage | null;
}

/**
 * Loads the product page and ignores responses that are no longer current.
 *
 * React concept: loading is derived when the snapshot key does not match the
 * query. The effect only stores a result, and cleanup aborts the request.
 * Why: a fast search must not paint results for an older query. Pass enabled
 * false until the viewport page size is known, so the first request is the
 * page the shopper will see.
 */
export function useProductSearch(query: ProductQuery, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const key = `${JSON.stringify(query)}:${attempt}`;
  const [snapshot, setSnapshot] = useState<Snapshot>({
    key: '',
    status: { state: 'idle' },
    page: null,
  });

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const requestKey = key;

    listProducts(query, controller.signal)
      .then((result) => {
        setSnapshot({ key: requestKey, status: { state: 'success' }, page: result });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }
        setSnapshot({
          key: requestKey,
          status: { state: 'error', message: friendlyMessage(error) },
          page: null,
        });
      });

    return () => controller.abort();
  }, [enabled, key, query]);

  if (snapshot.key !== key) {
    return { status: { state: 'loading' } as RequestStatus, page: null, retry };
  }

  return { status: snapshot.status, page: snapshot.page, retry };
}
