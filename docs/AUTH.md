# Auth

## Where the token lives

`sessionStorage`, keys `bug-bazaar.token` and `bug-bazaar.user`. The Redux session slice is the in-memory copy. Middleware writes it after `setSession` and `clearSession`.

A 401 from `apiRequest` dispatches `clearSession`.

## Why sessionStorage

It survives a refresh, so a shopper is not signed out on reload. It ends when the tab closes, so a shared computer does not keep the demo session as long as `localStorage` would.

## What we did not choose

- `localStorage` keeps the token after the browser restarts. That is a longer window if a script can read storage.
- An httpOnly cookie is the stronger production choice because JavaScript cannot read it. This app has no real server to set that cookie. The mock would only be pretending.

## Other rules

- Checkout and account are behind `ProtectedRoute`. The previous path is stored on the login location state.
- The login button disables while `submitting` is true, so a double click does not send two logins.
- A wrong password is a 401 with the copy "Email or password is incorrect." That string is ours. It is not the raw JSON message.
