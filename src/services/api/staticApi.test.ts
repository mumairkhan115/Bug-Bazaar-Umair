import { describe, expect, it } from 'vitest';
import { callStaticApi, tickStaticStock } from './staticApi';

describe('staticApi', () => {
  it('returns a page of products without a server', () => {
    const result = callStaticApi({
      method: 'GET',
      pathname: '/api/products',
      searchParams: new URLSearchParams(),
      body: undefined,
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ total: 5000 });
  });

  it('changes a product stock value', () => {
    const update = tickStaticStock();

    expect(update?.productId).toMatch(/^\d+$/);
    expect(update?.stock).toBeGreaterThanOrEqual(0);
    expect(update?.stock).toBeLessThan(15);
  });
});
