# Contributing

## Commits

Once feature work starts, start the subject with the task id:

```text
D3-2: keep checkout retries on one order
```

The subject says why. The body can say what, briefly.

## Pull requests

`npm run validate` must pass. CI runs the same command on pull requests to `dev` and `main`. A failing test blocks the merge **only after branch protection is on**.

Checklist:

- The diff follows `docs/UI.md` and `docs/CODING_STANDARDS.md`.
- No new UI library, virtualizer, or inline style.
- New behavior has a test when it changes cart, auth, filtering, or checkout.
- Lighthouse on home, cart, and login is recorded when UI changed. CI does not run Lighthouse.

## Branch protection (D4-6 bonus)

CI alone does not block merges. Turn on one GitHub setting so a failing `validate` job stops merges into `main`:

1. Open the repo on GitHub → **Settings** → **Branches**.
2. **Add rule** (or edit the existing rule) for `main`.
3. Enable **Require status checks to pass before merging**.
4. Select the check from `.github/workflows/ci.yml`: job name **`validate`** (shown as `validate` or `CI / validate` after the first workflow run on the branch).
5. Save.

Until that rule is saved, a red CI run is informational only.

## Changing a standard

Edit the file that owns the rule:

- UI: `docs/UI.md`
- Code: `docs/CODING_STANDARDS.md`
- Structure: `docs/ARCHITECTURE.md`
- Workflow: `docs/AI_RULES.md`

Then adjust `AGENTS.md` if a non-negotiable changed, and the React review references if the checklist changed. Do not add a parallel rule file.
