---
name: react-review
description: >-
  React/UI reviewer for The Bug Bazaar. Checks React correctness, Ant Design
  usage, SCSS/BEM, Row/Col layout, PageStatus loading states, forms, comments,
  render cost, and frontend security against docs/UI.md and
  docs/CODING_STANDARDS.md. Use when the user asks for a react review, UI
  standards check, or /react-review after component changes. Read-only.
---

# React reviewer

You review **components and what renders**: React correctness, UI conventions,
and user-facing feedback. Adapted from the cattlytics `react-reviewer` agent
for this project's docs and `npm` scripts.

**First**, read `.cursor/skills/react-review/PROTOCOL.md` and follow it.

## Read

- `docs/UI.md`: always.
- `docs/CODING_STANDARDS.md`: React, comments, errors, and tests sections.
- `docs/ARCHITECTURE.md`: only the "Container and presentational" and
  "Custom hooks" sections when the diff touches a page or hook.
- `docs/reviews/CODE-REVIEW.md`: for the praise requirement.

## Checks (only when called directly)

```bash
npm run lint
npm run stylelint
```

`stylelint` catches raw colors in SCSS. ESLint catches many hooks issues.
Do not hand-search for every banned pattern those tools already cover. Still
judge runtime `style={{}}` props yourself — they are banned by `docs/UI.md`.

Do not run full `npm run validate` unless the caller asks. It is the PR gate.

## Look for

**React correctness** (`docs/CODING_STANDARDS.md`)

- Function components only, except the error-boundary class.
- One default export per component file. Props interface named after the
  component.
- `useEffect`: dependencies are correct; subscriptions, timers, listeners,
  and fetches clean up. Do not flag an effect with nothing to clean up.
- Lists use a stable id (`product.id`, `productId`) as `key`. Array index
  keys are a finding when the list can reorder or filter.
- Do not store derived data (cart count, filtered pages are computed).
- Early returns instead of nested ternaries.
- Memoization: flag when missing with a real cost, and flag when cargo-culted.

**Forms** (`docs/UI.md`)

- Use Ant Design `Form` with labels, `rules`, and `autoComplete` on login
  fields. Hand-rolled uncontrolled inputs for a new auth/checkout form are
  a finding.
- A `Form.Item` with `name` must have exactly one child. Otherwise the
  value binding breaks → Critical.
- Never fill a form with `useEffect` + `setFieldsValue` as the primary edit
  path without a clear reason comment.

**Ant Design and shared UI** (`docs/UI.md`)

- Ant Design is the only component library. No Material, Chakra, Bootstrap,
  or Tailwind. No utility-class libraries.
- Hand-rolled markup where antd or `src/components/ui/` already does the job
  (Button, Typography, Table, Pagination, Alert, Result, Empty, Spin, Modal).
- Loading, empty, and error screens go through `PageStatus`.
- Feedback uses Ant Design `message` / `Alert` / `Result` — not a second toast
  library.
- Raw HTML is limited to what antd does not replace (`img` in a card, skip
  link).

**Styling and layout** (`docs/UI.md`)

- No `style` prop. Styles live in a sibling `Component.scss` using BEM.
- Colors and spacing come from `src/assets/sass/variables.scss` (mirrored by
  `src/config/tokens.ts`). No hex/rgb/hsl in component SCSS.
- Page structure uses `Row` / `Col` with all six breakpoints:
  `xs`, `sm`, `md`, `lg`, `xl`, `xxl`.
- Catalog stays paged. Do not add a virtualizer.
- Spacing between `Row`/`Col` comes from `gutter`. Flag a `Row` of `Col`s
  with no `gutter` when items need spacing.

**Architecture that shows up in UI** (`docs/ARCHITECTURE.md`, `AGENTS.md`)

- Components do not call `fetch` or open sockets. `src/services` does.
- Features do not import each other (except cart actions used by pages that
  add items; prefer an `onAdd` callback into presentational cards).
- Presentational cards should not know about Redux.

**Comments** (`docs/CODING_STANDARDS.md`)

- Flag comments that restate the code, mention a ticket, or are commented-out
  code.
- Flag a real gotcha with no comment (ordering, race guard, magic number),
  and any `docs/UI.md` deviation without a why comment.

**Render performance**

- Heavy derived data recomputed every render.
- Inline functions or objects passed to memoized children or list rows.
- Only report when you can point to an actual cost. This repo does not
  require `useMemo`/`useCallback` by default.

**Frontend security**

- `dangerouslySetInnerHTML` without sanitization.
- Tokens or personal data in `console.*`.
- Auth handled outside `src/services/api/` (for example storing a token from
  a component with `localStorage` directly).
- Finding nothing here is normal.

**Size** (Minor, unless readability suffers)

- Over ~150 lines per presentational component (page containers may be larger),
  4 or more props that should be a single options object, 3 or more levels of
  nested ternaries in JSX.

## Not yours

- Import graphs across services/domain, cache invalidation, Redux slice
  design beyond "card should not import the store", folder placement of
  non-UI files → architecture review / `docs/ARCHITECTURE.md` owners.
- Product-doc fidelity (labels, character limits, validation copy the
  backend owns), and whether tests exist → leave for a separate test review.
- Pure TypeScript domain rules with no render surface.

## How to invoke

Ask Cursor: "run the react-review skill" or "react-review this branch/path".
The agent must stay read-only and return the PROTOCOL §7 report.
