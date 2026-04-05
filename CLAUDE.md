# CrazyGaGa – Claude Code Instructions

## Version Bumping (REQUIRED)

**Every commit to `main` MUST include a version bump — no exceptions.**

Two places must stay in sync:

1. **`src/config.js`** — `export const VERSION = 'X.Y.Z';`
2. **`index.html`** — `<script type="module" src="./src/main.js?v=X.Y.Z">`

### Rules
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Bug fixes / small tweaks → bump **PATCH** (e.g. `1.0.1` → `1.0.2`)
- New features → bump **MINOR** (e.g. `1.0.1` → `1.1.0`)
- Breaking changes → bump **MAJOR** (e.g. `1.1.0` → `2.0.0`)

This applies to **every direct commit and every merge commit** on `main` —
including small fixes, typos, and refactors.

The `?v=X.Y.Z` query string on `index.html` forces browsers to reload
`main.js` when the version changes, busting the ES module cache.
Player progress stored in `localStorage` is unaffected by version bumps.

## Project Structure

```
CrazyGaGa/
├── src/                    # All game source modules
│   ├── main.js             # Entry point: canvas setup, game loop, input/animation
│   ├── game.js             # Game state machine & core update loop
│   ├── config.js           # VERSION constant + static CONFIG object
│   ├── gameConfig.js       # Runtime config layer with localStorage overrides
│   ├── configEditor.js     # In-game config editor UI & state
│   ├── player.js           # Player entity: movement, HP, stats, skill levels
│   ├── enemy.js            # Enemy entity: AI state machine, behavior execution
│   ├── boss.js             # Boss AI: 4 bosses with unique attack patterns
│   ├── spawner.js          # Wave spawning: difficulty scaling, enemy selection
│   ├── weapons.js          # Weapon manager: attack patterns & registry
│   ├── projectile.js       # Projectile entity: movement, pierce, collision
│   ├── pickup.js           # EXP gem entity: magnetism, auto-pickup
│   ├── collision.js        # Spatial hash grid for broad-phase collision
│   ├── particles.js        # Particle system: damage numbers, kill explosions
│   ├── renderer.js         # Canvas 2D rendering: game world, UI, menus, editor
│   ├── input.js            # Keyboard + touch input, virtual joystick
│   ├── meta.js             # Meta progression: gold, shop upgrades, character unlocks
│   ├── settings.js         # User settings persistence (localStorage)
│   └── data/               # Extensible game content data
│       ├── characters.js   # 6 playable characters with stats & starting weapons
│       ├── enemies.js      # 10+ enemy types + 4 bosses with behavior configs
│       ├── weapons.js      # 6 weapon definitions
│       ├── skills.js       # 14 skills: 6 weapon + 8 passive upgrades
│       ├── upgrades.js     # Meta shop upgrade definitions
│       └── evolutions.js   # Weapon evolution recipes
├── tests/                  # Vitest unit tests (19 files, ~2,400 lines)
├── openspec/               # Spec-driven change workflow
│   ├── config.yaml
│   ├── specs/              # 14 feature specification documents
│   └── changes/            # Active & archived change artifacts
├── .github/workflows/      # CI/CD: ci.yml, deploy.yml
├── .claude/                # Claude Code hooks & skills
├── index.html              # HTML entry point (module loader + canvas)
├── package.json
├── vitest.config.js
└── stryker.config.js       # Mutation testing config
```

## Development

```bash
npm test                # Run all Vitest tests once
npm run test:watch      # Continuous test mode
npm run test:coverage   # Generate coverage report
npm run test:mutate     # Mutation testing (code quality)
npm run test:mutate:ci  # Mutation testing for CI
```

**No build step required.** The project uses vanilla ES Modules; run tests and open `index.html` directly.

## Architecture

### Technology Stack
- Pure vanilla JavaScript (ES Modules, no framework)
- HTML5 Canvas 2D rendering
- No build/transpilation step
- Vitest + jsdom for unit testing
- Stryker for mutation testing

### Game Loop (Fixed Timestep)
`main.js` drives `requestAnimationFrame`. Each frame:
1. Compute delta time (capped at 100ms to prevent spiral of death)
2. Poll input (`input.js`)
3. Call `game.update(dt)` — entity updates, collision, spawning
4. Call `renderer.draw(game)` — canvas 2D rendering

### Configuration System (Three Layers)
1. **`src/config.js`** — Static defaults (`CONFIG` object). Edit this file to change base game values.
2. **`src/gameConfig.js`** — Runtime layer. Merges static config with localStorage overrides. Exports `getConfig()`, `getEnemyTypes()`, `getWeaponDefs()`, `getSkillDefs()`, `getCharacterDefs()`, `getUpgradeDefs()`, `setOverride()`, `resetAllOverrides()`, `exportJSON()`, `importJSON()`.
3. **`src/configEditor.js`** — In-game editor UI (7 tabs: settings, global, enemies, weapons, passives, characters, upgrades). Writes overrides via `setOverride()`.

### Collision Detection
`collision.js` implements a spatial hash grid (cell size: 64px). Used in `game.js` for enemy-vs-player, projectile-vs-enemy, and pickup-vs-player detection.

### Meta Progression
`meta.js` persists gold, upgrade levels, and character unlocks to `localStorage`. Loaded at startup, updated after each run.

## Key Conventions

### Adding New Content
- **New enemy type**: Add entry to `src/data/enemies.js`. Follow the existing schema (id, name, emoji, stats, behavior).
- **New weapon**: Add entry to `src/data/weapons.js` and implement the attack pattern in `src/weapons.js`.
- **New skill**: Add to `src/data/skills.js`. Passive skills are applied in `player.js`; weapon skills level the weapon.
- **New character**: Add to `src/data/characters.js`.
- **New weapon evolution**: Add recipe to `src/data/evolutions.js`.

### Testing Conventions
- Every non-trivial module has a corresponding test file in `tests/`.
- Tests use Vitest (`describe`/`it`/`expect`). DOM APIs are available via jsdom.
- Run `npm test` before committing. All tests must pass.
- Test files mock canvas/localStorage where needed — follow patterns in existing tests.

### Commit Conventions
- Commits go to `main` via feature branches.
- **Every commit to `main` must bump the version** (see Version Bumping above). No commit lands on `main` without a version change.
- Commit messages: short imperative summary ending with the new version, e.g. `Fix enemy spawning near map edge (v1.2.2)`.

### localStorage Keys
| Key | Owner | Purpose |
|-----|-------|---------|
| `crazygaga_meta` | `meta.js` | Gold, upgrade levels, unlocked characters |
| `crazygaga_settings` | `settings.js` | User difficulty/speed sliders |
| `crazygaga_config_overrides` | `gameConfig.js` | In-game config editor overrides |

## Gameplay Reference

**Core Loop:** Move → stop → auto-attack enemies → collect EXP gems → level up (pick 1 of 3 skills) → survive escalating waves → beat boss every 100 kills → win at 500 kills.

**Controls:** WASD / arrow keys (desktop) or virtual joystick (mobile). Player auto-attacks when stationary (or always if `combat.fireWhileMoving` is enabled).

**6 Weapons:** Bow & Arrow, Magic Orb (orbit), Lightning Chain (bounce), Fire Circle (ground), Boomerang (returns), Holy Sword (raining).

**8 Passive Skills:** Vitality (HP), Speed, Power (damage), Cooldown (attack speed), Armor (damage reduction), Regen (HP/sec), Magnetic (pickup range), Wisdom (EXP bonus).

**4 Bosses:** Demon Lord, Lich King, Stone Golem, Death Reaper — each with unique attack patterns, spawning every 100 kills.

**Difficulty scaling:** Enemy HP +10%/min, enemy damage +5%/min (`config.js` → `difficulty`).

## OpenSpec Workflow

The `openspec/` directory contains spec-driven change artifacts:
- `openspec/specs/` — authoritative feature specifications (read before modifying a system)
- `openspec/changes/` — active changes (tasks, design, implementation notes) and archives

Use `/opsx:propose`, `/opsx:explore`, `/opsx:apply`, `/opsx:archive` skills for structured development.

## Deployment

GitHub Actions deploys to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`).
Live URL: `https://sinorga.github.io/CrazyGaGa/`
