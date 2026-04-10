# CrazyGaGa – Claude Code Instructions

## Version Bumping (REQUIRED)

**Every time you commit or merge to `main`, you MUST bump the version.**

Two places must stay in sync:

1. **`src/config.js`** — `export const VERSION = 'X.Y.Z';`
2. **`index.html`** — `<script type="module" src="./src/main.js?v=X.Y.Z">`

### Rules
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Bug fixes / small tweaks → bump **PATCH** (e.g. `1.0.1` → `1.0.2`)
- New features → bump **MINOR** (e.g. `1.0.1` → `1.1.0`)
- Breaking changes → bump **MAJOR** (e.g. `1.1.0` → `2.0.0`)

The `?v=X.Y.Z` query string on `index.html` forces browsers to reload
`main.js` when the version changes, busting the ES module cache.
Player progress stored in `localStorage` is unaffected by version bumps.

## Project Structure

- `src/` — all game source modules
- `src/main.js` — entry point (extracted from `index.html`)
- `src/config.js` — VERSION constant + global CONFIG object
- `src/gameConfig.js` — runtime config layer with localStorage overrides
- `src/configEditor.js` — in-game config editor state/logic
- `tests/` — Vitest unit tests
- `openspec/` — spec-driven change workflow

## Development

```bash
npm test          # run Vitest tests
```
