# UI standards

This file owns visual rules for The Bug Bazaar. Cursor and Claude must follow it for every UI change. `AGENTS.md` only points here.

## Component library

Ant Design is the only UI library. Use its components for buttons, forms, tables, feedback, layout, and navigation.

Add a custom component only when Ant Design has no equivalent, as with `PageStatus` and the error boundary. Do not add Material UI, Chakra, Bootstrap, or Tailwind.

Raw HTML is limited to elements Ant Design does not replace: `img` inside a card, and the skip link.

## Styling

- Do not use the `style` prop.
- Do not use styled-jsx, CSS-in-JS, or utility-class libraries.
- Each component has a sibling SCSS file with the same base name: `ProductCard.tsx` and `ProductCard.scss`.
- Shared files are only `src/assets/sass/global.scss`, `src/assets/sass/variables.scss`, and `src/assets/sass/mixins.scss`.
- Do not add `style.scss`, `styles.scss`, or `common.scss`.

Vite prepends `@use "variables"` and `@use "mixins"` for component files. Do not import those files again in a component.

## BEM

The block name matches the component in kebab case.

```scss
.product-card {
}

.product-card__title {
}

.product-card--out-of-stock {
}
```

One element level. No nested selectors for elements. A modifier is a separate class.

## Tokens

`src/config/tokens.ts` is the canonical color list. `src/assets/sass/variables.scss` mirrors it. A unit test fails if they drift. Ant Design's theme imports the TypeScript tokens.

Use these names:

- `$color-primary`, `$color-white`
- `$color-text`, `$color-text-secondary`
- `$color-bg`, `$color-bg-layout`, `$color-border`
- `$color-success`, `$color-warning`, `$color-error`, `$color-info`
- `$space-xs` through `$space-xl`
- `$radius-md`, `$shadow-card`
- `$font-size-sm`, `$font-size-md`, `$font-size-lg`

Do not write hex, rgb, or hsl in a component file.

## Layout

Use Ant Design `Row` and `Col` for page structure.

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={8}>
    <Card>Content</Card>
  </Col>
</Row>
```

Set all six breakpoints on every column. The catalog is a paged grid, 12 cards below `lg` and 24 from `lg` up. Do not mount 5,000 cards and do not add a virtualizer.

The sidebar uses Ant Design's `md` breakpoint. Do not invent widths such as 820px.

## Media queries

Prefer `Col` props. A custom query, if one is ever required, uses 576, 768, 992, 1200, or 1600 and sits next to the rule it changes.

## Components

- Typography: Ant Design `Typography`, not raw headings.
- Buttons: `Button`, including submit buttons in forms.
- Forms: `Form` with labels, rules, and `autoComplete` on login fields.
- Tables: `Table` for the cart. Pagination is `Pagination`.
- Feedback: `Alert`, `Result`, `Empty`, `Spin`, and `message` only through Ant Design.
- Loading, empty, and error screens go through `PageStatus` so list and detail match.
- Modals and dropdowns, when added, use Ant Design `Modal` and `Dropdown`.

## Accessibility

- Every input has a visible label.
- Product names are real links, so the grid works from the keyboard.
- Form errors use text the browser can announce. Ant Design `Alert` and form errors cover this.
- Images that repeat the product name use an empty `alt`.
- The skip link is the first focusable control.
- Do not remove focus outlines.

## Responsive behavior

Check the catalog at a narrow viewport and at `lg` or wider. The column spans must change, and the page size must follow the breakpoint.
