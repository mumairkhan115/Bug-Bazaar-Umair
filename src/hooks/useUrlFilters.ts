import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isCategory, isSortKey } from '../domain/catalog';
import type { Category, SortKey } from '../domain/types';

export type FaultMode = '' | '500' | 'empty';

export interface UrlFilters {
  search: string;
  category: Category | '';
  inStock: boolean;
  sort: SortKey;
  page: number;
  fault: FaultMode;
}

/**
 * Reads the catalog view from the query string.
 *
 * Why: refresh, copied links, and the Back button all restore the same view
 * because the URL is the source of truth. Page size follows the viewport, so
 * a leftover pageSize param is removed and never written back.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);

  const updateFilters = useCallback(
    (patch: Partial<UrlFilters>) => {
      setParams((current) => filtersToSearchParams({ ...parseFilters(current), ...patch }));
    },
    [setParams],
  );

  useEffect(() => {
    if (!params.has('pageSize')) {
      return;
    }
    setParams((current) => filtersToSearchParams(parseFilters(current)), { replace: true });
  }, [params, setParams]);

  return { filters, updateFilters };
}

function parseFault(value: string | null): FaultMode {
  if (value === '500' || value === 'empty') {
    return value;
  }
  return '';
}

export function parseFilters(params: URLSearchParams): UrlFilters {
  const category = params.get('category');
  const sort = params.get('sort');
  const page = Number(params.get('page'));

  return {
    search: params.get('search') ?? '',
    category: isCategory(category) ? category : '',
    inStock: params.get('inStock') === '1',
    sort: isSortKey(sort) ? sort : 'name',
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    fault: parseFault(params.get('fault')),
  };
}

export function filtersToSearchParams(filters: UrlFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.inStock) {
    params.set('inStock', '1');
  }
  if (filters.sort !== 'name') {
    params.set('sort', filters.sort);
  }
  if (filters.page !== 1) {
    params.set('page', String(filters.page));
  }
  if (filters.fault) {
    params.set('fault', filters.fault);
  }
  return params;
}
