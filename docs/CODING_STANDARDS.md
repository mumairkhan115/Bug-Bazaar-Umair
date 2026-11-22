# Coding standards

This file owns TypeScript, React, naming, and comments. UI rules stay in `docs/UI.md`.

## TypeScript

- `strict` is on. Do not weaken it.
- No `any`. No `@ts-ignore`. No `@ts-expect-error`.
- Prefer unions and `interface` for object shapes. Do not add enums. `erasableSyntaxOnly` forbids them.
- Import types with `import type` when the file only needs the type.
- Model request state as the `RequestStatus` union so loading and error cannot both be true.

## React

- Function components, except the error boundary, which must be a class.
- One default export per component file.
- Props get an interface named after the component.
- Lists use a stable id (`product.id`, `productId`) as the key.
- Effects that subscribe or fetch return a cleanup.
- Do not store derived data. Cart count and filtered pages are computed.
- Custom hooks start with `use` and exist only when they remove real duplication.

## State

- URL: search, category, stock filter, sort, page, page size.
- Redux: cart and session.
- Component state: form drafts, the idempotency key, and request snapshots.
- Server cache: `src/services/api/cache.ts`.

## Naming

- Components: `PascalCase.tsx`
- Hooks and functions: `camelCase`
- SCSS blocks: `kebab-case`
- Feature folders: `src/features/<feature>`

## Imports

Features may import `src/services`, `src/components/ui`, `src/hooks`, and `src/domain`. A feature does not import another feature, except the cart actions used by pages that add items. Prefer passing an `onAdd` callback from the container into a presentational card.

## Comments

Comment a function when it encodes a decision: a reducer, a hook, a service call, an effect with cleanup, or an error mapper.

Say what it does, why it exists, which React or JavaScript idea it uses, and the important effect. Do not comment JSX that reads clearly.

```tsx
/**
 * Handles product search.
 *
 * React concept: useState stores the draft. The URL is updated after a debounce.
 *
 * JavaScript concept: the query string is the source the Back button can restore.
 */
```

## Errors

Throw `ApiRequestError` from the client. Screens call `friendlyMessage` or map `details` onto form fields. Do not render `error.message` from the JSON body.

## Tests

Test what a shopper or a contract can observe: cart quantities, filter results, login validation, checkout success, and a 409. Do not assert on private function names inside a component.
