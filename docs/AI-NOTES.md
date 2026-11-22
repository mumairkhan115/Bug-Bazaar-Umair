# AI notes

Notable AI sessions while building The Bug Bazaar. No secrets. Written so I can explain each choice in the walkthrough.

## How I used AI

AI drafted a lot of the store: mock API, catalog, cart, auth, hooks, CI, and docs. I kept the decisions in `docs/DECISIONS.md`, rejected anything that fought Ant Design / `Row`+`Col`, and rewrote bits I could not defend out loud.

---

## Day 1–2 — Foundation and browse

- **Prompt:** Set up The Bug Bazaar against the shared API contract: strict TypeScript, a mock with 5,000 products, a single fetch client, then a paged catalog with URL filters, `PageStatus`, and race-safe search.
- **Kept:** `server/mockApi.ts` + `src/domain` as the contract, `src/services/api/client.ts` as the only HTTP path, URL-backed filters, AbortController cleanup on the product page, and `useProductSearch` / `useDebouncedValue`.
- **Changed and why:** Dropped the idea of loading all 5,000 cards at once. The contract already has `page` and `total`, so the grid stays on Ant Design `Row` / `Col` with a page size of 12 or 24. Also stopped setting request status inside effects; status is derived from a snapshot key so an older response cannot win.
- **Mistake caught:** First search draft showed stale results when typing fast. Caught it by hammering the search box and by the race test in `hooks.test.tsx`. Fix was abort + ignore mismatched snapshot keys.

---

## Day 3 — Cart, auth, and checkout

- **Prompt:** Add Redux Toolkit for cart and session, a cart page that respects stock, protected checkout with an idempotency key, login/logout, and one place that maps API errors to friendly UI.
- **Kept:** Cart and session slices, derived `selectCartCount` / `selectCartSubtotal` for the header badge, `sessionStorage` for the token (see `docs/AUTH.md`), and `Idempotency-Key` on place-order so a double click does not create two orders.
- **Changed and why:** Skipped `redux-persist` and TanStack Query. Two slices do not need a persist library; middleware writes cart to `localStorage` and session to `sessionStorage`. Caching stayed as a small in-memory GET cache with invalidation after an order.
- **Mistake caught:** An early checkout path could fire twice before `submitting` flipped. Caught it by retrying Place order in the UI and in the LoginPage/checkout tests. Guard is a submitting flag plus the same idempotency key.

---

## Day 4–5 — Harden, explain, and scope cleanup

- **Prompt:** Live stock over WebSocket with reconnect and cleanup, behavior tests, CI on PR, error boundary + monitoring notes, architecture/orders/glossary docs, then strip extras that were not in the PDF and commit day-by-day with `D*-` messages.
- **Kept:** `stockClient` + `useStockFeed`, ~25 behavior tests, `.github/workflows/ci.yml` running `npm run validate`, `AppErrorBoundary`, and the Day 5 writeups that match the code.
- **Changed and why:** Removed the Learn page and `docs/task-list` curriculum — they were teaching UI, not the store. Skipped a virtualizer again (documented in `docs/PERFORMANCE.md`). Renamed the npm package to `bug-bazaar` and the GitHub repo to `Bug-Bazaar-Umair` without renaming the product brand in the UI.
- **Mistake caught:** AI first proposed `@tanstack/react-virtual` for the 5,000-item list. That needed an inline transform and fought `Row`/`Col`. Rejected it; paging was enough. Also caught UTF-16 `README.md` corruption when rewriting for submission — rewrote as UTF-8 so teammates can clone cleanly.

---

## One thing I would not hand to AI

The 10-minute walkthrough answers: why the token lives in `sessionStorage`, why paging beat virtualization, and what breaks if the idempotency key is dropped. Those have to come from me without reading a generated script.
