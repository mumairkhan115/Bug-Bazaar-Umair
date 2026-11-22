# Review protocol

Shared by the Bug Bazaar React reviewer skill. Read this before judging anything.

## Read-only

Report findings. Never edit, create, or delete files. Use the shell only for
read-only commands: `git`, `npm` check and test scripts, `rg`/`grep`, `ls`.

## 1. Scope

**If dispatched with a diff range and file list**, use them exactly. Do not
recompute them. Do not rerun checks already provided.

**If called directly**, resolve scope:

```bash
git fetch origin master --quiet 2>/dev/null
BASE=$(git merge-base HEAD origin/master 2>/dev/null || git merge-base HEAD master 2>/dev/null || git merge-base HEAD origin/dev 2>/dev/null || git merge-base HEAD dev)
git diff --name-only $BASE...HEAD
git status --short
```

- Given a branch, use `$BASE...<branch>`. Given a path, limit to that path.
- Uncommitted and untracked files in the review area are in scope.
- If neither command resolves a base **and** there is no working-tree change
  list, say so and stop. Do not guess at the scope.
- When the working tree is a large unfinished rewrite with no useful merge
  base against the old tree, treat `src/features`, `src/components/ui`, and
  related SCSS as the scope and say that in the report.

## 2. The docs are the rules

Read the docs listed in `SKILL.md` before judging. If this skill conflicts
with a doc, **the doc wins**. Report the conflict as a Nitpick titled
"Reviewer drift".

Do not duplicate rules from `docs/UI.md`, `docs/CODING_STANDARDS.md`, or
`docs/ARCHITECTURE.md` into new files. Quote those docs as evidence.

## 3. Evidence

- Open the file and quote the line before reporting a finding.
- Rule-based findings must also quote the doc line the rule comes from.
- A false positive costs as much as a missed bug. No findings in your area
  is fine and normal.

## 4. Stay in your lane

Honor the **Not yours** list in `SKILL.md`. Do not report those items, even
as notes.

## 5. Severity

- **Critical**: broken behaviour or data (broken form binding, wrong business
  rule, security hole), or a failing check in your area.
- **Major**: a violated `docs/UI.md` or React correctness rule without a
  comment explaining why, or a clear accessibility break.
- **Minor**: idiom, naming, size, comment hygiene.
- **Nitpick**: only when the caller asked for a thorough review, or for
  reviewer drift.

## 6. Grade

- **A**: no Critical and no Major.
- **B**: no Critical, 1–2 Major.
- **C**: no Critical, 3 or more Major.
- **D**: exactly 1 Critical.
- **F**: 2 or more Critical.

## 7. Output

```
## react-reviewer: <A–F> — <one line>

### Checks
<commands you ran (or received) · pass/fail · relevant excerpt · what was NOT run>

### Scope
<base..head or working-tree scope, N files in your area, M files skipped>

### Critical
### Major
### Minor
### Nitpicks
#### <short title>
**File**: `path:line`
**Evidence**: <quoted code> [+ <quoted doc line>]
**Problem**: <why it matters>
**Fix**: <concrete change>

### What's good
<2–4 specific bullets, or "Nothing notable.">
```

Write "None." under any empty severity heading. Do not pad the report.
Also leave at least one praise item so the report matches
`docs/reviews/CODE-REVIEW.md`.
