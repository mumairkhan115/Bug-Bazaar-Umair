# Glossary

Terms a reviewer may ask for, using this store.

## Latency

The time from a search keystroke to the product grid. The debounce and the mock delay are both latency. The race guard exists because latency is not zero.

## Idempotency

Doing the checkout twice with the same key has the same result as doing it once. `placeOrder` returns the original order and does not decrement stock again.

## Horizontal scaling

Adding more app instances behind a load balancer. The Bug Bazaar mock keeps orders in memory, so a second instance would not see them. A real order service would put the order and the idempotency key in shared storage.

## CDN

A cache near the shopper for images and static files. The gear SVGs in `public/gear` are the files a CDN would serve. Product stock would not live only on the CDN, because it changes.

## Cache invalidation

Deciding the cached product list is no longer true. `createOrder` calls `invalidateProductCache` so the next visit refetches stock. Until then, a cached page can be slightly stale. That is acceptable for a catalog browse and not acceptable for the checkout decision, which reads stock on the server.

## Eventual consistency

After checkout, the stock socket and the next fetch may not agree for a moment. Both move toward the stock the order service stored. The confirmation page trusts the order response, not the card that was on screen when the shopper clicked Add.
