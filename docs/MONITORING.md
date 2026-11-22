# Monitoring

## What the app does now

`AppErrorBoundary` catches a render exception, shows an Ant Design fallback, and calls `logError`. The account page has "Simulate crash" so the path can be demonstrated. Logs go to the console and an in-memory buffer. They are not sent to a vendor.

## Three things to track in production

1. Uncaught render errors, with the route and a release id, so a bad deploy is visible.
2. Checkout failures by status (400, 401, 409, 500), so stock bugs and outages are separate.
3. Stock socket disconnects that do not reconnect, so a live catalog that has gone quiet is visible.

## What we would not track

Do not log the session token, the password, or the full cart payload.
