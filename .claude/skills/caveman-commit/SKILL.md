---
name: caveman-commit
description: Generate ultra-compressed commit messages in Conventional Commits format, under 50 characters. Use when the user says "write a commit", "commit message", "generate commit", or invokes /commit or /caveman-commit.
license: MIT
source: https://github.com/JuliusBrussee/caveman
metadata:
  author: JuliusBrussee
  version: "1.0"
---

Generate terse, ready-to-paste commit messages following Conventional Commits. Output only the message as a code block. No git commands, no staging, no amending.

---

## Format

```
<type>(<scope>): <imperative summary>

[optional body — only when necessary]
```

---

## Subject Line Rules

- Max **50 chars** preferred, hard cap **72**
- Imperative mood: "add", "fix", "remove" — not "added", "fixed"
- No trailing period
- Lowercase after colon

## Supported Types

`feat` `fix` `refactor` `perf` `docs` `test` `chore` `build` `ci` `style` `revert`

---

## Body (include only when needed)

- Non-obvious reasoning
- Breaking changes
- Migration notes
- Issue references

Wrap at 72 chars. Use dash bullets.

---

## Never Include

- "This commit does X" / "I" / self-referential language
- Attribution ("Generated with Claude Code")
- Emoji (unless project convention requires it)
- Redundant scope in message body

---

## Steps

1. Read the staged diff or user's description of changes
2. Identify the type and scope
3. Draft subject line ≤50 chars in imperative mood
4. Add body only if non-obvious reasoning, breaking change, or issue ref needed
5. Output as a single fenced code block, ready to paste
