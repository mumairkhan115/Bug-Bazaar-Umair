import type { Category, Product, ProductPage, ProductQuery, SortKey } from './types.ts';
import { categories, sortKeys } from './types.ts';

const adjectives = ['Clicky', 'Quiet', 'Sunny', 'Midnight', 'Amber', 'Moss', 'Bold', 'Tiny'];

const nouns: Record<Category, readonly string[]> = {
  keyboards: ['Board', 'Switch', 'Deck'],
  ducks: ['Duck', 'Flock', 'Floater'],
  coffee: ['Roast', 'Brew', 'Bean'],
  stickers: ['Sticker', 'Decal', 'Mark'],
};

/**
 * Builds the same 5,000 products on every run.
 *
 * JavaScript concept: a pure function of the index, with no Math.random.
 * Why: tests, the mock server, and screenshots all see the same catalog.
 */
export function createCatalog(): Product[] {
  return Array.from({ length: 5000 }, (_, index) => {
    const category = categories[index % categories.length] ?? 'ducks';
    const nounList = nouns[category];
    const adjective = adjectives[index % adjectives.length] ?? 'Bug';
    const noun = nounList[index % nounList.length] ?? 'Duck';
    const id = String(index + 1);

    return {
      id,
      name: `${adjective} ${noun} ${id}`,
      price: 499 + (index % 80) * 25,
      category,
      stock: index % 19 === 0 ? 0 : (index % 12) + 1,
      rating: (index % 5) + 1,
      imageUrl: `https://picsum.photos/seed/bugbazaar-${id}/400/300`,
    };
  });
}

export function isCategory(value: string | null): value is Category {
  return categories.some((category) => category === value);
}

export function isSortKey(value: string | null): value is SortKey {
  return sortKeys.some((sortKey) => sortKey === value);
}

/**
 * Filters, sorts, and pages products without mutating the source array.
 *
 * JavaScript concept: filter and slice return new arrays.
 * Why: the mock API and the tests share one definition of "the current view".
 */
export function queryProducts(products: readonly Product[], query: ProductQuery): ProductPage {
  const search = query.search.trim().toLowerCase();
  const matched = products.filter((product) => {
    const matchesSearch = search.length === 0 || product.name.toLowerCase().includes(search);
    const matchesCategory = query.category === '' || product.category === query.category;
    const matchesStock = !query.inStock || product.stock > 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const sorted = [...matched].sort((left, right) => compareProducts(left, right, query.sort));
  const start = (query.page - 1) * query.pageSize;

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
  };
}

function compareProducts(left: Product, right: Product, sort: SortKey): number {
  switch (sort) {
    case 'price-asc':
      return left.price - right.price;
    case 'price-desc':
      return right.price - left.price;
    case 'rating':
      return right.rating - left.rating;
    case 'name':
      return left.name.localeCompare(right.name);
  }
}

/**
 * Older, shorter searches wait longer so a fast typist can see a race.
 * The client must ignore the late response. The delay itself does not fix it.
 */
export function delayFor(search: string): number {
  return 900 - Math.min(search.length, 8) * 90;
}

export function parseProductQuery(params: URLSearchParams): ProductQuery {
  const categoryParam = params.get('category');
  const sortParam = params.get('sort');
  const page = Number(params.get('page'));
  const pageSize = params.get('pageSize') === '24' ? 24 : 12;

  return {
    search: params.get('search') ?? '',
    category: isCategory(categoryParam) ? categoryParam : '',
    inStock: params.get('inStock') === '1',
    sort: isSortKey(sortParam) ? sortParam : 'name',
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize,
  };
}
