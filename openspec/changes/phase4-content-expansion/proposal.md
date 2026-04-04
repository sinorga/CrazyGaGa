## Why

The MVP game loop is playable but content-limited. Players encounter only basic charger/shooter/tank/exploder enemies and have no boss encounters. Weapons lack evolution paths. To keep players engaged past the 3-minute mark, we need boss fights with unique attack patterns, the summoner enemy behavior, weapon evolution combos, and a chain lightning + area damage weapon that actually function in combat. This phase fills out the content that makes each run feel different.

## What Changes

- Implement boss spawning system: bosses appear on a timer (every 3 min), with dedicated AI, multi-phase attack patterns, and a health bar overlay
- Activate summoner enemy behavior: necromancers spawn minions on a timer
- Implement chain lightning weapon pattern: target selection, chain bouncing with visual feedback
- Implement area weapon pattern: holy sword rain targeting enemies with random offset
- Implement boomerang weapon: outbound + return path with continuous damage
- Add weapon evolution system: combining a weapon at max level with a specific passive unlocks an evolved form
- Add difficulty scaling: enemy HP/damage multipliers that increase over time
- Add screen-shake and flash effects on boss hits and player damage for game feel

## Capabilities

### New Capabilities
- `boss-system`: Boss spawning, boss AI with attack patterns (charge, bullet-ring, bullet-spiral, teleport, summon), boss HP bar UI
- `weapon-evolution`: Combining max-level weapons with specific passives to create evolved weapons with enhanced effects
- `difficulty-scaling`: Time-based multipliers on enemy HP and damage to maintain challenge in late game

### Modified Capabilities
- `enemy-system`: Add summoner behavior implementation, integrate boss spawning into wave system
- `weapon-system`: Implement chain, area (holy sword), and boomerang weapon patterns that currently exist as stubs
- `renderer`: Add boss HP bar, screen-shake effect, damage flash

## Impact

- Modified: `src/game.js` — boss spawn timer, difficulty scaling, screen shake
- Modified: `src/enemy.js` — summoner behavior with actual minion spawning
- Modified: `src/weapons.js` — chain/area/boomerang patterns fully implemented
- Modified: `src/renderer.js` — boss HP bar, screen shake, damage flash
- New: `src/data/evolutions.js` — weapon evolution recipe definitions
- Modified: `src/data/enemies.js` — potential new enemy types for late game
- Modified: `src/config.js` — difficulty scaling parameters
- New tests for boss AI, weapon patterns, evolution system, difficulty scaling
