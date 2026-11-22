# Architecture

This document matches the code. It covers folder structure, data flow, where state lives, and three patterns.

## Folders

```text
src/router.tsx     browser router
src/stores         Redux store
src/config         Ant Design theme and color tokens
src/assets/sass    variables, mixins, global CSS
src/components/ui  shell, page status, protected route, error boundary
src/features       catalog, product, cart, checkout, auth, orders
src/hooks          debounce, URL filters, product search, stock feed, Redux hooks
src/services       HTTP client, cache, orders, stock socket, logger
src/domain         types and the mock contract, shared with the Vite server
server/mockApi.ts  HTTP and WebSocket adapter for dev and preview
```

## Data flow

```text
Shopper
  -> route
  -> feature container
  -> service (fetch or socket)
  -> Vite mock (handleApi)
  -> domain rules
```

Redux is beside that path for the cart and the session. The URL is beside it for filters.

## Where state lives

| Kind   | Examples                                  | Home                           |
| ------ | ----------------------------------------- | ------------------------------ |
| Server | products, stock, orders                   | mock API, then the GET cache   |
| Client | cart lines, token, user                   | Redux, persisted by middleware |
| URL    | search, category, sort, page              | `useUrlFilters`                |
| Local  | login fields, checkout key, scroll button | component state                |

The header badge reads `selectCartCount`. That number is not stored.

## Patterns

### API adapter

`handleApi` in `src/domain/api.ts` is the contract. The Vite middleware is a thin transport. React never imports `handleApi`. Services call `apiRequest`. This keeps status codes and tests in one place.

Why: the PDF allows any mock, and a single adapter is what makes 400, 401, 404, 409, and 500 consistent.

### Custom hooks

`useDebouncedValue` and `useUrlFilters` are the two required hooks. `useProductSearch` and `useStockFeed` exist because the race guard and the socket cleanup would otherwise be copied.

Why: a hook is justified only when it removes duplication or hides a cleanup that is easy to forget.

### Container and presentational components

`CatalogPage` reads the URL, loads data, and dispatches `addItem`. `ProductCard` receives a product and `onAdd`. It does not know about Redux.

Why: the card can be read without the store, and the page can change data loading without rewriting the card.

## Dependency direction

`router` / `stores` -> features -> services -> domain.

The server imports domain. Features do not import `server/`.

## Decisions worth defending

Paging instead of a virtualizer keeps every layout on `Row` and `Col` and still holds 5,000 products in the API. The cart uses Redux because the badge, the cart page, and checkout share it. Filters stay in the URL because refresh and Back are requirements.
