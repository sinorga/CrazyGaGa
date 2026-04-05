## Why

The game currently has no persistence between runs — each game starts from scratch. A meta-progression system gives players a sense of long-term progress, increasing motivation to replay. Gold earned during runs can be spent on permanent upgrades, and unlockable characters add variety. This is the natural next step after Phase 4's content expansion.

## What Changes

- Enemies drop gold on death (in addition to EXP gems)
- Gold accumulates across runs, persisted in localStorage
- New "商店" (Shop) button on main menu opens a permanent upgrade shop
- 6 permanent upgrades purchasable with gold: starting HP, damage, speed, armor, gold rate, EXP bonus
- Each upgrade has multiple levels with increasing cost
- 3 playable characters with different starting weapons and base stats
- Characters unlocked by spending gold, selectable from a character select screen
- All meta data (gold, upgrade levels, unlocked characters) persisted in localStorage

## Capabilities

### New Capabilities
- `meta-shop`: Upgrade shop UI, upgrade definitions, purchase logic, gold persistence
- `character-system`: Character definitions, character select UI, unlock logic, stat application

### Modified Capabilities
- `game-loop`: Add gold tracking during run, apply permanent upgrades at game start, add shop/character-select states
- `renderer`: Add gold HUD display, shop page rendering, character select rendering

## Impact

- `src/data/upgrades.js`: New file — permanent upgrade definitions
- `src/data/characters.js`: New file — character definitions
- `src/meta.js`: New file — gold/upgrade/unlock persistence (localStorage)
- `src/game.js`: Gold tracking, permanent stat application, new states
- `src/renderer.js`: Shop page, character select page, gold in HUD
- `index.html`: Wire new states, gold drop rendering
