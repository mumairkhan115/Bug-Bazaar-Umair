# AI notes

Add an entry for each notable AI session. Do not paste secrets.

## Template

- Prompt:
- Kept:
- Changed and why:
- Mistake caught:
- Would not hand to AI:

## Entry

- Prompt: Build The Bug Bazaar from the approved plan, with Ant Design only and no virtualizer.
- Kept: Paged `Row` and `Col` catalog, Redux cart, sessionStorage token, explicit fetch client, WebSocket stock feed, and one shared `AGENTS.md`.
- Changed and why: Dropped `@tanstack/react-virtual` because paging already limits the DOM and the library needed an inline transform.
- Mistake caught: A first pass set loading state directly inside effects. The hooks lint rejects that. Request status is now derived from a snapshot key so an older response cannot win.
- Would not hand to AI: The final explanation of a trade-off in the review call. The author has to be able to defend token storage and paging without reading a generated answer.
