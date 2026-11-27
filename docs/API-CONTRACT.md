# API contract

Prices are integer cents. The mock is `server/mockApi.ts` calling `handleApi`. Same-origin paths. `Cache-Control: no-store` so the browser HTTP cache is not the app cache.

## Endpoints

### GET /api/products

Query: `search`, `category` (`keyboards`, `ducks`, `coffee`, `stickers`), `inStock=1`, `sort` (`name`, `price-asc`, `price-desc`, `rating`; omitted means `rating`, highest first), `page`, `pageSize` (`12` or `24`), `delay=1`.

- 200 `{ items: Product[], total: number }`
- 500 when `search=__error_500`
- Catalog UI demo: URL `fault=500` maps to that search; `fault=empty` searches `__no_match__` for an empty PageStatus

### GET /api/products/:id

- 200 `Product`
- 404 unknown id
- 500 when id is `__error_500`

### POST /api/login

Body `{ email, password }`.

- 200 `{ token, user }`
- 400 validation `details`
- 401 wrong password

Demo: `umair@bugbazaar.dev` / `quack`. Token: `token-umair`.

### GET /api/me

Header `Authorization: Bearer <token>`.

- 200 user
- 401

### POST /api/orders

Header `Authorization` and `Idempotency-Key`. Body `{ lines: [{ productId, quantity }] }`.

- 201 `{ id, status: "queued" }`
- 400 invalid body
- 401
- 409 `{ error.details.productName }` when quantity exceeds stock

The same idempotency key returns the original 201 body.

### GET /api/orders/:id

- 200 order
- 401
- 404

## Error body

```json
{
  "error": {
    "code": "out_of_stock",
    "message": "Out of stock",
    "details": { "productName": "Moss Duck 4" }
  }
}
```

Screens must not render `error.message`. They use `friendlyMessage` or field `details`.

## WebSocket

`/api/stock` sends `{ productId, stock }` about every second. Local and deployed use the same interval.

The browser may send `{ productIds: string[] }` so the next tick changes a product on the open page. With no list, the tick uses the first name-sorted page.

GitHub Pages has no socket server. The same HTTP paths are requested under the site base (`/Bug-Bazaar-Umair/api/...`) and answered by `sw.js`. A request to `https://<user>.github.io/api/...` skips that folder and returns 404. The open page asks the worker for each stock step, because a timer inside the worker stops when the browser shuts the worker down. The worker pushes `{ productId, stock }` on a broadcast channel. Asking stops when the tab closes.
