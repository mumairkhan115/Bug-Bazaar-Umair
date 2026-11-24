# The Bug Bazaar

A React and TypeScript store for developer gear. Prices are in cents. The Vite mock API serves the shared contract so the app runs without a real backend.

## Requirements

- Node.js 22
- npm

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints. The mock API is part of the dev server, so no backend is required.

Sign in with `umair@bugbazaar.dev` / `quack`.

## Environment

Copy `.env.example` to `.env` only if you need to override the API origin. The default is same-origin `/api`, which the Vite mock serves.

`VITE_API_BASE_URL` is optional. Leave it empty for local development.

GitHub Pages has no API process. The production build registers a service worker that answers `/<repository>/api/...`. A request to `https://<user>.github.io/api/...` skips the repository folder and returns 404. Local `npm run dev` keeps `/api` on the Vite server. The Pages workflow sets `VITE_BASE_PATH` and `VITE_STATIC_API=true`.

## Scripts

| Script                 | Result                                     |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Store with the mock API and stock socket   |
| `npm run test`         | Behavior tests                             |
| `npm run lint`         | ESLint                                     |
| `npm run typecheck`    | `tsc -b` with strict TypeScript            |
| `npm run format:check` | Prettier                                   |
| `npm run stylelint`    | SCSS rules, including BEM and color tokens |
| `npm run build`        | Typecheck and production bundle            |
| `npm run validate`     | All of the checks above                    |
| `npm run preview`      | Production bundle plus the mock API        |

A green build does not prove the UI standards. Stylelint, `docs/UI.md`, and the React review skill do that work.

## Accessibility check

Run `npm run preview`, then Lighthouse in Chrome on `/`, `/cart`, and `/login`. The target is an accessibility score of 90 or higher. Record the scores in `docs/REFLECTION.md` or the pull request. CI does not run Lighthouse.

## Walkthrough

1. Search, filter, refresh, and use Back.
2. Open a product and add it to the cart.
3. Sign in and check out.
4. Explain one hard bug (stale search or a duplicate order) and one trade-off (session token storage, or paging instead of virtualization).

## More

- Engineering rules: `AGENTS.md`
- UI rules: `docs/UI.md`
- Architecture: `docs/ARCHITECTURE.md`
- API contract: `docs/API-CONTRACT.md`
- Auth: `docs/AUTH.md`
