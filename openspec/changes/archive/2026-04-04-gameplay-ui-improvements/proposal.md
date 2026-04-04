## Why

Players lack control during gameplay (no pause/exit), the level-up skill selection UI causes accidental picks due to its position overlapping the joystick area, skills can be picked indefinitely making late-game choices meaningless, and the magic orb weapon doesn't scale well or interact with enemy projectiles.

## What Changes

- Add a pause/options button during gameplay that pauses the game and shows a menu to resume or exit to main menu
- Display current skill levels in the gameplay HUD so players can track their build
- Change level-up skill selection panel to horizontal layout, positioned higher on screen to avoid accidental taps while moving
- Reduce all weapon skill maxLevel from 8 to 5; max-level skills are already excluded from selection pool (existing logic)
- Magic orb count scales with weapon level (currently +1 every 3 levels, change to +1 every level)
- Magic orbs can destroy/deflect enemy projectiles on contact

## Capabilities

### New Capabilities
- `pause-menu`: In-game pause overlay with resume and exit options

### Modified Capabilities
- `renderer`: New pause overlay, horizontal skill selection layout, skill level display in HUD
- `weapon-system`: Magic orb count scaling changed, orb vs enemy projectile collision
- `progression`: Weapon skill maxLevel reduced from 8 to 5

## Impact

- `src/game.js`: New 'paused' state, pause toggle handler, orb-vs-projectile collision in `_processCollisions`
- `src/renderer.js`: Pause overlay, horizontal level-up panel, skill level HUD display, pause button
- `src/data/skills.js`: maxLevel changes for weapon skills
- `src/weapons.js`: Orb count formula change
- `index.html`: Pause button click wiring
