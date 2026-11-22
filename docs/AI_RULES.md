# AI workflow

`AGENTS.md` is the short checklist. This file is the full workflow for Cursor and Claude. Do not keep a second copy of the UI or coding rules here.

## Sequence

1. Read the tool entry file: `CLAUDE.md` or `.cursor/rules/project-standards.mdc`.
2. Read `AGENTS.md`.
3. Read `docs/UI.md` for UI or styling work.
4. Read `docs/CODING_STANDARDS.md` and `docs/ARCHITECTURE.md` when the change touches structure, types, or state.
5. Inspect existing features and shared components.
6. If the prompt conflicts with a standard, stop. Name the rule and propose a compliant approach. Do not implement the conflicting version.
7. Write a short implementation plan.
8. Name the files to change.
9. Implement only after the developer approves that plan.
10. Validate with the scripts that match the change. `npm run validate` is the full gate.
11. Report the change, the commands you ran, and anything still open.

A review does not edit code unless the developer asks for the fixes.

## Both tools

- Cursor loads `AGENTS.md` and `.cursor/rules/*.mdc`.
- Claude loads `CLAUDE.md`, which imports `AGENTS.md`.
- There is no second copy of these rules. Path-scoped copies drift.

## Changing a standard

Follow `docs/CONTRIBUTING.md`. Edit the owning document first. Update `AGENTS.md` only when a non-negotiable changed. Do it in one pull request.

## Logging AI help

Record notable AI use in `docs/AI-NOTES.md`: the prompt, what you kept, what you changed, one mistake you caught, and one task you would not hand to AI. Code you cannot explain does not count as finished.
