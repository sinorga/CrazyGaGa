## Context

The MVP has a working game loop with 4 enemy behaviors, 2 functional weapon patterns (projectile, orbit), and level-up progression. Chain, area, and boomerang weapons exist as code stubs but don't fully function in combat. Bosses are defined in `src/data/enemies.js` but never spawn. Phase 4 fills these gaps and adds weapon evolution as a late-game progression hook.

## Goals / Non-Goals

**Goals:**
- Boss encounters every 3 minutes with multi-phase attack patterns
- All 6 weapon types fully functional with visible effects
- Weapon evolution system for end-game power spikes
- Summoner enemies that create actual minions
- Difficulty scaling so late-game stays challenging
- Game feel improvements (screen shake, damage flash)

**Non-Goals:**
- New enemy art/sprites (still using colored circles)
- Sound effects (Phase 6)
- Meta progression / permanent upgrades (Phase 5)
- New weapon types beyond the existing 6

## Decisions

### 1. Boss as special wave event
**Decision**: Boss spawning is a timer in `game.js` (every `CONFIG.waves.bossInterval` seconds). When triggered, a boss spawns and no regular waves spawn until the boss is dead. Boss phase increments each time.
**Why**: Simple to implement. Creates a natural pacing — clearing the boss is a milestone. No need for a separate boss arena.
**Alternative**: Boss mixed into regular waves — rejected, boss gets lost in the crowd.

### 2. Boss AI as state machine
**Decision**: Each boss has an `attacks` array (defined in data). Boss cycles through attacks based on cooldown timers. Each attack type is a function: `charge`, `bullet_ring`, `bullet_spiral`, `teleport`, `summon`.
**Why**: Data-driven — adding a new boss only requires a data entry with attack configs. The attack functions are reusable across bosses.

### 3. Weapon evolution via recipe lookup
**Decision**: A new `src/data/evolutions.js` defines recipes: `{ weaponId, requiredPassive, result }`. When a weapon hits max level AND the player has the required passive, the evolution option appears on next level-up.
**Why**: Encourages build diversity — players need specific combos. Data-driven so new evolutions can be added easily.
**Alternative**: Auto-evolve at max level — rejected, removes player choice.

### 4. Difficulty scaling as time multipliers
**Decision**: `CONFIG.difficulty` defines `hpMultiplierPerMinute` and `damageMultiplierPerMinute`. Enemy stats are multiplied by `1 + elapsed_minutes * multiplier` at spawn time.
**Why**: Simple, predictable scaling. Tunable via config. Applied at spawn so existing enemies keep their stats.

### 5. Screen shake as camera offset
**Decision**: Screen shake adds a random offset to camera position that decays over time. Triggered on boss hit and player damage.
**Why**: Zero-cost implementation — just add random to existing camera offset. No new systems needed.

## Risks / Trade-offs

- **[Boss difficulty balance]** → All boss values in config, easy to tune. Start conservative.
- **[Bullet patterns performance]** → `bullet_ring` creates 12+ projectiles at once. Existing cleanup handles it, but monitor with 200+ enemies on screen.
- **[Evolution discoverability]** → Players won't know what combos exist. Future: add a collection/recipe book UI (Phase 6).
