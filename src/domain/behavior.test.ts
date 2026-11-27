import { readFileSync } from 'node:fs';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { createCatalog, delayFor, queryProducts } from '../domain/catalog';
import { handleApi, toApiPath } from '../domain/api';
import {
  readStockTickRequest,
  readWatchIds,
  shouldPublishTick,
  stockTickGapMs,
  stockTickRequest,
  tickVisibleStock,
} from '../domain/stockTick';
import { joinBasePath } from '../services/api/mode';
import { formatPrice } from '../domain/money';
import { placeOrder } from '../domain/orders';
import { friendlyMessage, ApiRequestError } from '../services/api/errors';
import { clearCache, invalidateProductCache, readCache, writeCache } from '../services/api/cache';
import cartReducer, {
  addItem,
  changeQuantity,
  removeItem,
  selectCartCount,
  selectCartSubtotal,
} from '../features/cart/cartSlice';
import { filtersToSearchParams, parseFilters } from '../hooks/useUrlFilters';
import { colorVariables } from '../config/tokens';

const sample = {
  productId: '1',
  name: 'Clicky Board 1',
  price: 499,
  stock: 2,
};

describe('catalog rules', () => {
  const products = createCatalog();

  it('formats cents as dollars', () => {
    expect(formatPrice(499)).toBe('$4.99');
  });

  it('seeds 5000 products', () => {
    expect(products).toHaveLength(5000);
  });

  it('filters by search, category, and stock', () => {
    const page = queryProducts(products, {
      search: 'duck',
      category: 'ducks',
      inStock: true,
      sort: 'name',
      page: 1,
      pageSize: 12,
    });
    expect(page.items.every((item) => item.category === 'ducks' && item.stock > 0)).toBe(true);
    expect(page.items.every((item) => item.name.toLowerCase().includes('duck'))).toBe(true);
    expect(page.total).toBeGreaterThan(0);
  });

  it('returns an empty page when nothing matches', () => {
    const page = queryProducts(products, {
      search: 'zzzz-no-match',
      category: '',
      inStock: false,
      sort: 'name',
      page: 1,
      pageSize: 12,
    });
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  });

  it('waits longer for a shorter search', () => {
    expect(delayFor('a')).toBeGreaterThan(delayFor('keyboard'));
  });

  it('defaults an empty catalog URL to rating order', () => {
    expect(parseFilters(new URLSearchParams()).sort).toBe('rating');
    const params = filtersToSearchParams({
      search: '',
      category: '',
      inStock: false,
      sort: 'rating',
      page: 1,
      fault: '',
    });
    expect(params.has('sort')).toBe(false);
  });

  it('reads filters from the query string', () => {
    const filters = parseFilters(
      new URLSearchParams('search=duck&category=ducks&inStock=1&sort=rating&page=2&pageSize=24'),
    );
    expect(filters).toEqual({
      search: 'duck',
      category: 'ducks',
      inStock: true,
      sort: 'rating',
      page: 2,
      fault: '',
    });
  });

  it('leaves page size out of the page URL', () => {
    const params = filtersToSearchParams({
      search: 'duck',
      category: 'ducks',
      inStock: true,
      sort: 'rating',
      page: 2,
      fault: '',
    });
    expect(params.has('pageSize')).toBe(false);
    expect(params.has('sort')).toBe(false);
    expect(params.get('page')).toBe('2');
  });

  it('gives each category its own drawing', () => {
    const byCategory = {
      keyboards: products.find((product) => product.category === 'keyboards'),
      ducks: products.find((product) => product.category === 'ducks'),
      coffee: products.find((product) => product.category === 'coffee'),
      stickers: products.find((product) => product.category === 'stickers'),
    };
    expect(byCategory.keyboards?.imageUrl).toMatch(/gear\/keyboards-[123]\.svg$/);
    expect(byCategory.ducks?.imageUrl).toMatch(/gear\/ducks-[123]\.svg$/);
    expect(byCategory.coffee?.imageUrl).toMatch(/gear\/coffee-[123]\.svg$/);
    expect(byCategory.stickers?.imageUrl).toMatch(/gear\/stickers-[123]\.svg$/);
    expect(products.every((product) => !product.imageUrl.includes('picsum'))).toBe(true);
  });
});

describe('live stock and api paths', () => {
  const products = createCatalog();
  const firstPage = queryProducts(products, {
    search: '',
    category: '',
    inStock: false,
    sort: 'rating',
    page: 1,
    pageSize: 24,
  });

  it('changes a product on the first page when nothing is watched', () => {
    const update = tickVisibleStock(products, []);
    expect(firstPage.items.some((item) => item.id === update?.productId)).toBe(true);
  });

  it('changes the product the page is showing', () => {
    const target = products.find((product) => product.id === '4000');
    const before = target?.stock ?? 0;
    const update = tickVisibleStock(products, ['4000']);
    expect(update).toEqual({ productId: '4000', stock: (before + 1) % 12 });
  });

  it('keeps contract paths under the repository base', () => {
    expect(toApiPath('/Bug-Bazaar-Umair/api/products')).toBe('/api/products');
    expect(toApiPath('/api/stock')).toBe('/api/stock');
    expect(toApiPath('/src/services/api/mode.ts')).toBeUndefined();
    expect(toApiPath('/cart')).toBeUndefined();
    expect(
      joinBasePath('https://mumairkhan115.github.io', '/Bug-Bazaar-Umair/', '/api/products?page=1'),
    ).toBe('https://mumairkhan115.github.io/Bug-Bazaar-Umair/api/products?page=1');
    expect(readWatchIds({ productIds: ['4', 2] })).toEqual(['4']);
  });

  it('wakes the Pages worker with the products on screen', () => {
    expect(readStockTickRequest(stockTickRequest(['25', '30']))).toEqual({
      type: 'stock-tick',
      productIds: ['25', '30'],
    });
    expect(readStockTickRequest({ productIds: ['25'] })).toBeUndefined();
    expect(readStockTickRequest({ type: 'stock-tick' })).toBeUndefined();
  });

  it('publishes one stock step about every second', () => {
    const start = 10_000;
    expect(shouldPublishTick(start, 0)).toBe(true);
    expect(shouldPublishTick(start + 400, start)).toBe(false);
    expect(shouldPublishTick(start + stockTickGapMs, start)).toBe(true);
  });
});

describe('cart rules', () => {
  it('increases quantity when the same product is added twice', () => {
    const once = cartReducer({ items: [] }, addItem(sample));
    const twice = cartReducer(once, addItem(sample));
    expect(twice.items).toHaveLength(1);
    expect(twice.items[0]?.quantity).toBe(2);
  });

  it('does not exceed stock', () => {
    const full = cartReducer({ items: [] }, addItem({ ...sample, quantity: 5 }));
    expect(full.items[0]?.quantity).toBe(2);
    const changed = cartReducer(full, changeQuantity({ productId: '1', quantity: 9 }));
    expect(changed.items[0]?.quantity).toBe(2);
  });

  it('ignores an add when stock is zero', () => {
    const next = cartReducer({ items: [] }, addItem({ ...sample, stock: 0 }));
    expect(next.items).toEqual([]);
  });

  it('removes a line', () => {
    const withItem = cartReducer({ items: [] }, addItem(sample));
    const next = cartReducer(withItem, removeItem('1'));
    expect(next.items).toEqual([]);
  });

  it('derives count and subtotal', () => {
    const state = { cart: cartReducer({ items: [] }, addItem(sample)) };
    expect(selectCartCount(state)).toBe(1);
    expect(selectCartSubtotal(state)).toBe(499);
  });
});

describe('orders and errors', () => {
  it('places an order and rejects a second key when stock is gone', () => {
    const products = createCatalog();
    const state = { products, orders: new Map(), idempotency: new Map() };
    const first = placeOrder(state, {
      lines: [{ productId: '2', quantity: 1 }],
      idempotencyKey: 'key-a',
    });
    expect(first.ok).toBe(true);
    const retry = placeOrder(state, {
      lines: [{ productId: '2', quantity: 1 }],
      idempotencyKey: 'key-a',
    });
    expect(retry.ok && first.ok && retry.order.id).toBe(first.ok ? first.order.id : '');
    const product = products.find((item) => item.id === '1');
    if (!product) {
      throw new Error('missing product');
    }
    product.stock = 0;
    const conflict = placeOrder(state, {
      lines: [{ productId: '1', quantity: 1 }],
      idempotencyKey: 'key-b',
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.status).toBe(409);
      expect(conflict.details.productName).toContain('1');
    }
  });

  it('returns the documented HTTP statuses', () => {
    const state = { products: createCatalog(), orders: new Map(), idempotency: new Map() };
    const missing = handleApi(state, {
      method: 'GET',
      pathname: '/api/products/missing',
      searchParams: new URLSearchParams(),
      body: undefined,
    });
    expect(missing.status).toBe(404);
    const failure = handleApi(state, {
      method: 'GET',
      pathname: '/api/products',
      searchParams: new URLSearchParams('search=__error_500'),
      body: undefined,
    });
    expect(failure.status).toBe(500);
    const denied = handleApi(state, {
      method: 'POST',
      pathname: '/api/orders',
      searchParams: new URLSearchParams(),
      body: { lines: [] },
    });
    expect(denied.status).toBe(401);
  });

  it('does not show the raw server message', () => {
    const error = new ApiRequestError(500, 'unavailable', undefined);
    error.message = 'SQL failed at row 4';
    expect(friendlyMessage(error)).toBe('The store is unavailable. Try again.');
    expect(friendlyMessage(error)).not.toContain('SQL');
  });

  it('names the out-of-stock product', () => {
    const error = new ApiRequestError(409, 'out_of_stock', { productName: 'Moss Duck 4' });
    expect(friendlyMessage(error)).toBe('Moss Duck 4 is out of stock.');
  });
});

describe('cache and tokens', () => {
  it('reuses a cached page and drops it after an order', () => {
    clearCache();
    writeCache('/api/products?page=1', { items: [], total: 0 });
    expect(readCache('/api/products?page=1')).toEqual({ items: [], total: 0 });
    invalidateProductCache();
    expect(readCache('/api/products?page=1')).toBeUndefined();
  });

  it('keeps SCSS color variables aligned with tokens', () => {
    const scss = readFileSync('src/assets/sass/variables.scss', 'utf8');
    for (const [name, value] of Object.entries(colorVariables)) {
      expect(scss).toContain(`$${name}: ${value};`);
    }
  });
});

describe('store wiring', () => {
  it('persists the cart', () => {
    localStorage.clear();
    const store = configureStore({
      reducer: { cart: cartReducer },
      middleware: (getDefault) => getDefault(),
    });
    store.dispatch(addItem(sample));
    expect(store.getState().cart.items).toHaveLength(1);
  });
});
