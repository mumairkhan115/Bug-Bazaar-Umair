# Orders

## What the shopper sees

Checkout posts the cart with an `Idempotency-Key` created once per visit. The response is `{ id, status: "queued" }`. The confirmation page reads that order. A retry with the same key returns the same id. Stock is decremented once.

A 409 names the product that exceeded stock and leaves the cart in place so the shopper can fix it.

## What happens after "queued"

This repository does not run payment, inventory, or email workers. The design is:

```text
Checkout
  -> Order service accepts the request
  -> Queue
       -> Payment worker
       -> Inventory worker
       -> Email worker
```

The queue lets the HTTP request finish after the order is durable. Workers retry on their own schedule.

If email is down, payment and inventory can still complete. The email worker retries. The shopper already has a queued confirmation. They are not charged again because the order id already exists.

## Double charge

The client reuses one idempotency key for the life of the checkout screen. The server stores that key beside the order. A second POST with the same key does not create a second order and does not decrement stock again. That is the same idea as a payment provider's idempotency key.
