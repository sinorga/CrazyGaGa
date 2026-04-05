# Proposal: game-config-editor

## What
Add a fully in-game configuration editor that lets designers tune all game parameters — enemies, weapons, passive skills, characters, and global rules — without touching source code. Configuration changes persist across sessions via localStorage and can be exported or imported as JSON files.

## Why
Currently all game tuning requires editing JS source files (`src/config.js`, `src/data/*.js`) and reloading the page. This blocks rapid iteration: designers must be developers, A/B testing a value means manually editing code, and sharing a tuned config requires distributing source files. A live config editor removes all of these friction points.

## What's Configurable

### Global Rules (`src/config.js`)
All numeric constants: player HP/speed, wave spawn rates, difficulty scaling, leveling thresholds, combat timing, map dimensions.

### Enemies (`src/data/enemies.js`)
Per enemy type: HP, speed, damage, exp, radius, unlock time, spawn weight, and all behavior fields (projectile speed, fire rate, preferred distance, explosion radius, summon count/interval, etc.).

### Weapons (`src/data/weapons.js`)
Per weapon: base damage, cooldown, max level, and all type-specific config fields (projectile speed/pierce/count, orbit radius/speed, chain range/count, area radius/duration, boomerang range).

### Passive Skills (`src/data/skills.js`)
Per passive: bonus value per level and max level.

### Characters (`src/data/characters.js`)
Per character: base HP, base speed, unlock cost.

### Upgrades (`src/data/upgrades.js`)
Per upgrade: cost per level, bonus value per level, max level.

## Out of Scope
- Adding or removing entity types (this is a tuning tool, not a content creation tool)
- Changing enemy behavior types or weapon attack patterns
- Real-time mid-run config changes (changes apply on next run start)
- Editing display names or emoji icons

## User Experience
- "設定配置" button on the main menu opens the config editor
- Tabbed interface: Global | Enemies | Weapons | Passives | Characters | Upgrades
- Click any numeric value to edit it inline via an HTML input
- "匯出 JSON" downloads the full config as a `.json` file
- "匯入 JSON" opens a file picker to load a previously exported config
- "重設預設值" resets all overrides back to compiled defaults
- All changes auto-save to localStorage immediately
