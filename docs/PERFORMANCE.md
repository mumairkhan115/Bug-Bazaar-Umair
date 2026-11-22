# Performance

## What was slow

The catalog seed is 5,000 products. Rendering one card per product would create thousands of DOM nodes on the first paint. That is the largest cost. The second cost is refetching a page the shopper just left, which the GET cache now skips.

## What we measured

`queryProducts` over the full seed, page size 5000, returns every match. Page size 24 returns 24 items. The DOM shows 24 `product-card` articles at the `lg` breakpoint and 12 below it. That is the before and after that matters: 5000 nodes versus one page.

Cart `selectCartCount` and `selectCartSubtotal` use `createSelector`. The header reads them on cart actions. Memoizing those two derivations is the optimization we kept, because the count is read outside the cart page.

`React.memo` on `ProductCard` was tried as an idea and skipped. A page of 24 cards does not show up as a render cost next to the network delay.

## Virtualization

Skipped. A virtualizer would fight `Row` and `Col`, and it would need an inline transform. Paging already keeps scrolling smooth. If a later screen must show thousands of rows without pages, use Ant Design `Table` with `virtual`. Do not add `@tanstack/react-virtual`.

## How to re-measure

1. `npm run dev`
2. In React DevTools, render the catalog and note the product card count.
3. Compare with a temporary `pageSize` of the full `total` only in a local experiment. Do not commit that page size.

## D4-3 note

Paging plus `createSelector` is the kept optimization. A virtualizer was skipped because it conflicts with `Row` and `Col`.

