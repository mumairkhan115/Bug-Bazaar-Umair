# API contract

Prices are integer cents. The mock is `server/mockApi.ts` calling `handleApi`. Same-origin paths. `Cache-Control: no-store` so the browser HTTP cache is not the app cache.

## Endpoints

### GET /api/products

Query: `search`, `category` (`keyboards`, `ducks`, `coffee`, `stickers`), `inStock=1`, `sort` (`name`, `price-asc`, `price-desc`, `rating`), `page`, `pageSize` (`12` or `24`), `delay=1`.

- 200 `{ items: Product[], total: number }`
- 500 when `search=__error_500`

### GET /api/products/:id

- 200 `Product`
- 404 unknown id
- 500 when id is `__error_500`

### POST /api/login

Body `{ email, password }`.

- 200 `{ token, user }`
- 400 validation `details`
- 401 wrong password

Demo: `ada@bugbazaar.dev` / `quack`. Token: `token-ada`.

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

`/api/stock` sends `{ productId, stock }` about every 4 seconds.
