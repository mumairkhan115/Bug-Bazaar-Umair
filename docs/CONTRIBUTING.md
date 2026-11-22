# Contributing

## Commits

Once feature work starts, start the subject with the task id:

```text
D3-2: keep checkout retries on one order
```

The subject says why. The body can say what, briefly.

## Pull requests

`npm run validate` must pass. CI runs the same command on pull requests to `dev` and `main`. A failing test blocks the merge.

Checklist:

- The diff follows `docs/UI.md` and `docs/CODING_STANDARDS.md`.
- No new UI library, virtualizer, or inline style.
- New behavior has a test when it changes cart, auth, filtering, or checkout.
- Lighthouse on home, cart, and login is recorded when UI changed. CI does not run Lighthouse.

## Changing a standard

Edit the file that owns the rule:

- UI: `docs/UI.md`
- Code: `docs/CODING_STANDARDS.md`
- Structure: `docs/ARCHITECTURE.md`
- Workflow: `docs/AI_RULES.md`

Then adjust `AGENTS.md` if a non-negotiable changed, and the React review references if the checklist changed. Do not add a parallel rule file.
