# Decisions

## Ant Design, SCSS, and BEM

The PDF lets the engineer choose libraries. This team standardizes on Ant Design, SCSS, and BEM so Cursor and Claude produce the same UI. Considered: another component library, Tailwind, and CSS-in-JS. Rejected because they split the styling rules.

## No virtualizer

Considered `@tanstack/react-virtual` for 5,000 cards. Rejected. The contract already has `page` and `total`. The screen renders 12 or 24 cards with `Row` and `Col`. Ant Design `Table` `virtual` remains the in-library option if a future screen must show thousands of rows at once.

## No TanStack Query

Considered a query library for cache and races. Rejected. The lessons need a visible `fetch`, `AbortController`, and explicit invalidation. The client is `src/services/api/client.ts`.

## No Redux Persist

Considered `redux-persist`. Rejected. One cart slice and one session slice do not justify it. Middleware writes the cart to `localStorage` and the session to `sessionStorage`.

## WebSocket instead of polling

Live stock uses a WebSocket on the Vite server. Polling and server-sent events would also work. The socket was chosen because the lesson has to show connect, reconnect, and stop-on-unmount. Polling would hide the cleanup.

GitHub Pages cannot upgrade a socket, and a request to `https://<user>.github.io/api/...` 404s because the site lives under the repository path. The Pages build registers a service worker at that base path. The worker answers the same contract and pushes stock on a broadcast channel. The dev server stays on the socket.

## Token in sessionStorage

See `docs/AUTH.md`.
