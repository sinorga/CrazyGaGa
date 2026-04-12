---
name: caveman-help
description: Display a quick-reference guide for all caveman skills and modes. Use when the user invokes /caveman-help or asks how caveman mode works.
license: MIT
source: https://github.com/JuliusBrussee/caveman
metadata:
  author: JuliusBrussee
  version: "1.0"
---

Display the caveman quick-reference. Non-persistent — showing help does NOT activate any mode or change state.

---

## Steps

Output the following reference card exactly:

---

**caveman** — token-efficient Claude. "why use many token when few do trick."

**Modes** (`/caveman [mode]`)

| Mode | Style |
|------|-------|
| lite | Drop filler. Keep sentence structure. |
| full *(default)* | Drop articles, filler, pleasantries, hedging. Fragments OK. |
| ultra | Extreme compression. Bare fragments. Tables > prose. |
| wenyan-lite | Classical Chinese, lite compression. |
| wenyan-full | Classical Chinese, full compression. |
| wenyan-ultra | Classical Chinese, max compression. |

**Skills**

| Skill | Trigger | Does |
|-------|---------|------|
| `/caveman` | caveman mode | Activates compressed responses |
| `/caveman-commit` | write a commit | Terse commit message ≤50 chars |
| `/caveman-review` | code review | One-line-per-finding PR feedback |
| `/caveman-help` | help | This reference |

**Exit**: "stop caveman" or "normal mode"

**Never compressed**: security warnings, irreversible confirmations, code blocks.
