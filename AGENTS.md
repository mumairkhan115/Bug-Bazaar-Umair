# Agent instructions

This file is the shared entry point for Cursor and Claude. The long-form rules live in `docs/`. Do not copy those rules into a second file.

## Before changing code

1. Read this file.
2. Read `docs/AI_RULES.md` for the full workflow.
3. Read `docs/UI.md` when the task touches UI or SCSS.
4. Read `docs/CODING_STANDARDS.md` and `docs/ARCHITECTURE.md` when the task touches structure, types, or state.
5. Inspect existing features and shared components before adding new ones.
6. If the prompt conflicts with these standards, stop, name the conflict, and propose a compliant approach.
7. Write a short plan and the file list.
8. Implement only after the developer approves that plan.
9. Check the result against the standards and run the relevant scripts.
10. Report what changed, what was validated, and what is still open.

## Non-negotiable

- React function components and strict TypeScript. No `any`. No `@ts-ignore`.
- Ant Design for UI. No second component library. No utility-class library.
- No inline `style`. Component styles live in a matching SCSS file using BEM.
- Colors come from `src/config/tokens.ts` and `src/assets/sass/variables.scss`.
- Page layouts use Ant Design `Row` and `Col` with `xs`, `sm`, `md`, `lg`, `xl`, and `xxl`.
- The catalog is paged. Do not add a virtualizer library.
- Features may import `src/services`, `src/components/ui`, `src/hooks`, and `src/domain`. They do not import each other.
- Components do not call `fetch` or open sockets. `src/services` does.
- Cart and session state change only through Redux reducers.
- Shareable view state stays in the URL.
- Comments explain meaningful functions. They do not narrate every line.

## Ownership

- `docs/UI.md` owns visual rules.
- `docs/CODING_STANDARDS.md` owns TypeScript, React, and comments.
- `docs/ARCHITECTURE.md` owns folders, state, and patterns.
- `docs/AI_RULES.md` owns the workflow.
- `docs/CONTRIBUTING.md` owns commits, pull requests, and how to change a standard.
- `docs/reviews/CODE-REVIEW.md` owns the review template.

## Validation

`npm run validate` runs lint, types, format, stylelint, tests, and the build. Say so when you could not run a step.
