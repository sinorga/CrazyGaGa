## Context

CrazyGaGa has data definitions (10 enemy types, 6 weapons, 14 skills), core utilities (spatial hash collision, particle system, input handler), and a TDD infrastructure (Vitest + Stryker). But there is no runnable game — no game loop, no entities, no rendering. This design covers the architecture to connect all existing pieces into a playable MVP.

## Goals / Non-Goals

**Goals:**
- Playable in-browser game loop: move, auto-attack, kill enemies, collect EXP, level up, die, restart
- Mobile-first with virtual joystick, keyboard on desktop
- All game entities testable in isolation (no Canvas dependency in logic)
- At least 3 working weapon patterns and 4 enemy behavior types

**Non-Goals:**
- Sound/music (Phase 6)
- Meta progression / permanent upgrades (Phase 5)
- Boss encounters (needs more balancing first)
- Menu system / character selection
- Save/load
- Performance optimization beyond spatial hash

## Decisions

### 1. Separate logic from rendering
**Decision**: All entity logic (Player, Enemy, Projectile, Pickup) is pure state — no Canvas references. Renderer reads state and draws.
**Why**: Enables unit testing without jsdom Canvas mocking. Rendering bugs don't break game logic.
**Alternative**: Entity owns its own `draw()` — rejected because it couples logic to Canvas API.

### 2. Fixed timestep game loop
**Decision**: `requestAnimationFrame` for render, fixed `dt = 1/60` for physics/logic updates with accumulator pattern.
**Why**: Deterministic behavior regardless of frame rate. Prevents physics glitches on slow devices.
**Alternative**: Variable timestep — rejected due to tunneling bugs at low FPS.

### 3. Game state machine
**Decision**: Simple string state: `'menu' | 'playing' | 'levelup' | 'gameover'`. Game loop switches behavior per state.
**Why**: Minimal complexity. Level-up pauses the game (no enemy movement), game-over shows stats.
**Alternative**: State pattern with classes — over-engineered for 4 states.

### 4. Weapon system as strategy pattern
**Decision**: Each weapon type has an `update(dt, player, enemies, projectiles)` function. Weapon instances hold state (cooldown timer, orbit angle). A `WeaponManager` iterates active weapons.
**Why**: Adding a new weapon pattern = adding one function. Data files define stats, code defines behavior.
**Alternative**: Giant switch statement — doesn't scale.

### 5. Enemy AI as behavior functions
**Decision**: Each enemy behavior type (`charger`, `shooter`, `tank`, `exploder`, `summoner`) is a function `(enemy, player, dt) → void` that updates velocity/state. The Enemy entity delegates to its behavior.
**Why**: Same as weapons — data defines stats, behavior function defines AI. New enemy types only need data.

### 6. Camera as simple offset
**Decision**: Camera is `{x, y}` offset = player position - screen center, with lerp smoothing. No zoom/rotation.
**Why**: Minimal. Sufficient for top-down 2D. All rendering subtracts camera offset.

### 7. UI as immediate-mode overlay
**Decision**: HUD, joystick, level-up panel all drawn directly on Canvas each frame (no DOM elements except the canvas itself).
**Why**: No DOM layout issues on mobile. Single rendering pipeline. Simpler touch handling.
**Alternative**: HTML/CSS overlays — better for complex UIs but adds DOM/Canvas coordination complexity.

## Risks / Trade-offs

- **[Performance with 200 enemies]** → Spatial hash limits collision checks. Enemies beyond screen+margin skip detailed AI. Profile after MVP.
- **[Touch input precision]** → Virtual joystick dead zone of 8px may feel wrong. Tunable in CONFIG.
- **[Weapon balance]** → First pass will be unbalanced. All values in config files for easy tuning.
- **[No object pooling yet]** → Frequent alloc/dealloc of projectiles and particles. Acceptable for MVP, add pooling if GC stalls appear.

## File Structure

```
index.html              — entry point, Canvas setup
src/game.js             — Game class: loop, state machine, orchestration
src/player.js           — Player entity: position, HP, stats, movement
src/enemy.js            — Enemy entity + behavior functions + wave spawner
src/projectile.js       — Projectile entity (player & enemy bullets)
src/pickup.js           — EXP gem entity with magnetic attraction
src/weapons.js          — WeaponManager + weapon pattern implementations
src/renderer.js         — All Canvas drawing: map, entities, HUD, UI
src/ui.js               — UI state: level-up panel, game-over overlay
src/input.js            — (existing) keyboard + touch input
src/collision.js        — (existing) spatial hash + helpers
src/particles.js        — (existing) particle effects
src/config.js           — (existing) all tunable values
src/data/enemies.js     — (existing) enemy definitions
src/data/weapons.js     — (existing) weapon definitions
src/data/skills.js      — (existing) skill definitions
```
