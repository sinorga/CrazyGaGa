# CrazyGaGa - Game Design Spec

## Overview
A Roguelite horde survival game combining Archero-style controls with Vampire Survivors-style gameplay.
Built with HTML5 Canvas 2D for browser/mobile.

## Core Mechanics

### Player Controls
- Virtual joystick (touch) / WASD (keyboard) for movement
- Auto-attack when stationary (Archero-style)
- Moving = dodging (no attack while moving)

### Combat System
- Weapons fire automatically at nearest enemy
- Multiple weapon types with distinct patterns: projectile, orbit, chain, area, boomerang
- Weapons upgrade through level-up skill choices

### Progression (Per Run)
- Enemies drop EXP gems on death
- Collecting enough EXP triggers level-up
- Level-up presents 3 random skill choices (weapon grants/upgrades + passive stats)
- Difficulty scales with time: more enemies, stronger variants, new types unlock

### Enemy System
- Enemy types defined in `src/data/enemies.js` (data-driven, extensible)
- Behavior types: charger, shooter, tank, exploder, summoner, boss
- Wave spawner increases intensity over time
- Boss appears every 3 minutes

### Weapon System
- Weapon types defined in `src/data/weapons.js` (data-driven, extensible)
- Attack patterns: projectile, orbit, chain, area, boomerang
- Each weapon has 8 upgrade levels with scaling stats

### Skill System
- Skills defined in `src/data/skills.js` (data-driven, extensible)
- Categories: weapon (grant/upgrade weapons), passive (stat boosts)
- Weighted random selection favors upgrading existing weapons

## Technical Architecture
- Vanilla JS with ES Modules (no build step)
- HTML5 Canvas 2D rendering
- Spatial hash grid for collision detection
- requestAnimationFrame game loop with fixed timestep
- localStorage for meta-progression saves

## Development Phases
1. Core framework (canvas, loop, movement, joystick) ✅
2. Combat (auto-attack, enemies, collision, HP) - in progress
3. Growth (EXP, level-up, skill selection, weapons)
4. Content (more enemies, bosses, weapon evolution)
5. Meta (gold, permanent upgrades, character unlock)
6. Polish (particles, sound, UI, balance)
