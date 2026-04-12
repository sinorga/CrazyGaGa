---
name: caveman-review
description: Generate ultra-compressed, one-line-per-finding code review feedback optimized for signal-to-noise ratio. Use when the user asks for a code review or invokes /caveman-review.
license: MIT
source: https://github.com/JuliusBrussee/caveman
metadata:
  author: JuliusBrussee
  version: "1.0"
---

Generate terse, comment-ready code review feedback. One finding per line. Exact location, concrete fix. Output only — no approvals, no linting, no writing fixes.

---

## Core Format

```
L<line>: <problem>. <fix>.
```

---

## Severity Prefixes (use for mixed-severity reviews)

| Prefix | Meaning |
|--------|---------|
| 🔴 | Bug — incorrect behavior |
| 🟡 | Risk — potential issue |
| 🔵 | Nit — style/minor improvement |
| ❓ | Question — unclear intent |

---

## Rules

- One line per finding
- Include exact line number(s)
- Give a concrete fix, not just a complaint
- Include "why" only when the fix isn't self-evident
- No hedging: "consider", "maybe", "you might want to" — cut it
- No restating what the code does
- No complimenting good code

---

## Exceptions (use full paragraph before resuming terse mode)

- CVE-level security findings
- Architectural disagreements
- Onboarding contexts where reasoning is essential

---

## Out of Scope

- Does NOT write the fixes
- Does NOT approve or request changes in the PR UI
- Does NOT run linters or static analysis
- Outputs comment-ready text for pasting into pull requests only

---

## Steps

1. Read the diff or code provided
2. Identify issues by line number
3. For each finding: write `L<line>: <problem>. <fix>.`
4. Add severity prefix if review has mixed severity levels
5. Output the list — nothing else
