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

  it('changes a product on the first page', () => {
    const update = tickStaticStock();
    const result = callStaticApi({
      method: 'GET',
      pathname: '/api/products',
      searchParams: new URLSearchParams('sort=rating&page=1&pageSize=24'),
      body: undefined,
    });
    const body = result.body as { items: { id: string; stock: number }[] };
    const match = body.items.find((item) => item.id === update?.productId);

    expect(match?.stock).toBe(update?.stock);
  });
});
