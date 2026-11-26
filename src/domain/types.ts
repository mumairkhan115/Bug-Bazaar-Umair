export const categories = ['keyboards', 'ducks', 'coffee', 'stickers'] as const;

export type Category = (typeof categories)[number];

export const sortKeys = ['name', 'price-asc', 'price-desc', 'rating'] as const;

export type SortKey = (typeof sortKeys)[number];

/** Highest rating first. Left out of the page URL. */
export const defaultSort = 'rating' as const satisfies SortKey;

/** Prices are integer cents so the client never does decimal money math. */
export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  rating: number;
  imageUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ProductQuery {
  search: string;
  category: Category | '';
  inStock: boolean;
  sort: SortKey;
  page: number;
  pageSize: 12 | 24;
}

export interface ProductPage {
  items: Product[];
  total: number;
}

export interface OrderLine {
  productId: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: 'queued';
  lines: OrderLine[];
}

/**
 * Request status is a union so loading, error, and success cannot be true together.
 * TypeScript concept: a discriminated union makes illegal states unrepresentable.
 */
export type RequestStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success' };

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
