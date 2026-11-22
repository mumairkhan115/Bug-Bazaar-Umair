import type { Product, ProductPage, ProductQuery } from '../../domain/types';
import { apiRequest } from './client';

/**
 * Loads one page of products.
 *
 * Why: the query string is the contract. `delay=1` lets the race lesson
 * show a slow response without slowing every other request.
 */
export function listProducts(query: ProductQuery, signal?: AbortSignal): Promise<ProductPage> {
  const params = new URLSearchParams();
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.category) {
    params.set('category', query.category);
  }
  if (query.inStock) {
    params.set('inStock', '1');
  }
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim().length > 0) {
    params.set('delay', '1');
  }

  return apiRequest<ProductPage>(`/api/products?${params.toString()}`, { signal });
}

export function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  return apiRequest<Product>(`/api/products/${encodeURIComponent(id)}`, { signal });
}
