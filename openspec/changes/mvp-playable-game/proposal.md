## Why

The project currently has data definitions (enemies, weapons, skills), core utilities (collision, particles, input), and a test infrastructure, but no runnable game. We need a minimum playable version — a single HTML page where the player can move, auto-attack waves of enemies, collect EXP, level up, and eventually die — to validate the core game loop and enable playtesting.

## What Changes

- Add `index.html` entry point with responsive Canvas setup
- Implement `Game` class: game loop (requestAnimationFrame + fixed timestep), state machine (menu → playing → level-up → game-over)
- Implement `Player` entity: movement via existing Input system, HP, invincibility frames, stats tracking
- Implement `Enemy` entity: charger/shooter/tank/exploder AI behaviors driven by data definitions
- Implement `Projectile` entity: player projectiles and enemy projectiles
- Implement weapon system: auto-attack when stationary, weapon patterns (projectile, orbit, chain, area, boomerang)
- Implement wave spawner: time-based enemy spawning with escalating difficulty
- Implement pickup system: EXP gems with magnetic attraction, collection
- Implement leveling system: EXP accumulation, level-up with 3 random skill choices
- Implement renderer: camera follow, map background, entity rendering, HUD (HP bar, EXP bar, level, timer)
- Implement UI overlays: virtual joystick rendering, level-up skill selection panel, game-over screen with restart

## Capabilities

### New Capabilities
- `game-loop`: Core game loop with fixed timestep, state machine (menu/playing/level-up/game-over), and Canvas setup
- `player-entity`: Player movement, HP, damage, invincibility, stat modifiers from skills
- `enemy-system`: Enemy spawning, AI behaviors (charger/shooter/tank/exploder), wave escalation
- `weapon-system`: Auto-attack logic, weapon patterns (projectile/orbit/chain/area/boomerang), weapon leveling
- `progression`: EXP gem drops, magnetic pickup, leveling, skill selection UI, passive stat application
- `renderer`: Camera, map rendering, entity drawing, HUD, virtual joystick overlay, UI panels

### Modified Capabilities

(none — all new capabilities)

## Impact

- New files: `index.html`, `src/game.js`, `src/player.js`, `src/enemy.js`, `src/projectile.js`, `src/pickup.js`, `src/weapons.js`, `src/renderer.js`, `src/ui.js`
- Existing `src/input.js`, `src/collision.js`, `src/particles.js` consumed by new systems
- Existing `src/data/*.js` and `src/config.js` consumed by entity/weapon/spawner logic
- New test files for each capability module
- No external dependencies — all vanilla JS + Canvas 2D
