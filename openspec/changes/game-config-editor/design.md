# Design: game-config-editor

## Architecture Overview

```
src/gameConfig.js          ← new: unified runtime config layer
src/configEditor.js        ← new: editor state + input handling
src/renderer.js            ← extended: drawConfigEditor()
src/game.js                ← extended: config_editor state + menu button
src/data/*.js              ← unchanged: static compiled defaults
src/config.js              ← unchanged: static compiled defaults
```

All game consumers that currently import directly from `src/config.js` or `src/data/*.js` are updated to import from `src/gameConfig.js` instead. The static files remain unchanged as the canonical defaults.

---

## `src/gameConfig.js` — Runtime Config Layer

This module is the single import point for all game data at runtime.

### Initialization
On module load:
1. Import all static defaults from `src/config.js` and all `src/data/*.js`
2. Load `localStorage.getItem('crazygaga_config_override')` (if present, parse as JSON)
3. Deep-merge the override JSON onto the defaults
4. Cache the merged result

### Exported Accessors
```js
export function getConfig()         // merged CONFIG object
export function getEnemyTypes()     // merged ENEMY_TYPES array
export function getWeaponDefs()     // merged WEAPON_DEFINITIONS array
export function getSkillDefs()      // merged SKILL_DEFINITIONS array
export function getCharacterDefs()  // merged CHARACTER_DEFINITIONS array
export function getUpgradeDefs()    // merged UPGRADE_DEFINITIONS array
export function getEvolutionRecipes() // unchanged (not editable)
```

### Override Storage Format
```json
{
  "config": { "player": { "maxHp": 600 }, "waves": { "bossKillThreshold": 50 } },
  "enemies": { "slime": { "hp": 20, "speed": 80 } },
  "weapons": { "arrow": { "damage": 15, "config": { "pierce": 3 } } },
  "skills":  { "passive_max_hp": { "value": 60 } },
  "characters": { "warrior": { "baseStats": { "maxHp": 600 } } },
  "upgrades": { "hp_boost": { "values": [75, 75, 75, 75, 75] } }
}
```
Keys are entity IDs; only fields that differ from defaults are stored. Deep-merge means unmentioned fields keep their default values.

### Mutation API (used by configEditor.js)
```js
export function setOverride(section, id, fieldPath, value)  // section='enemies', id='slime', fieldPath='hp'
export function resetAllOverrides()
export function exportJSON()   // returns JSON string of full merged config
export function importJSON(str) // parses, validates, stores, reloads cache
export function reloadCache()  // re-merges defaults + localStorage
```

---

## Consumer Updates

The following files currently import directly from static sources and must be updated to use `gameConfig.js`:

| File | Currently imports | Change to |
|------|------------------|-----------|
| `src/spawner.js` | `ENEMY_TYPES`, helpers from `data/enemies.js` | `getEnemyTypes()` from `gameConfig.js` |
| `src/boss.js` | `getBossForPhase` from `data/enemies.js` | `getEnemyTypes().find(...)` via `gameConfig.js` |
| `src/game.js` | `CONFIG` from `config.js`; all data imports | `getConfig()`, `getWeaponDefs()` etc. from `gameConfig.js` |
| `src/player.js` | `CONFIG` from `config.js` | `getConfig()` from `gameConfig.js` |
| `src/weapons.js` | `getWeaponDefinition` from `data/weapons.js` | `getWeaponDefs()` via `gameConfig.js` |
| `src/meta.js` | `CHARACTER_DEFINITIONS`, `UPGRADE_DEFINITIONS` | `getCharacterDefs()`, `getUpgradeDefs()` from `gameConfig.js` |
| `src/settings.js` | `CONFIG` | `getConfig()` from `gameConfig.js` |
| `src/renderer.js` | `CONFIG` | `getConfig()` from `gameConfig.js` |
| `src/particles.js` | `CONFIG` | `getConfig()` from `gameConfig.js` |
| `src/data/skills.js` | — | `getSkillDefs()` used by game.js |

Config is read at the start of each **run** (when `game.reset()` is called), not on every frame. This means config changes take effect on the next run.

---

## `src/configEditor.js` — Editor State

### State
```js
{
  activeTab: 'global',     // 'global' | 'enemies' | 'weapons' | 'passives' | 'characters' | 'upgrades'
  scrollY: 0,              // scroll offset within current tab
  fields: [],              // computed field list for current tab (rebuilt on tab change)
  activeInput: null,       // { fieldKey, x, y, w, h, currentValue, type } — HTML input overlay
}
```

### Field Registry
On tab change, `buildFields(tab)` produces an array of row descriptors:
```js
{ label, value, fieldKey, type }  // type: 'number' | 'color' | 'boolean'
```
`fieldKey` encodes the full path: e.g. `'enemies.slime.hp'`, `'config.player.maxHp'`, `'weapons.arrow.config.pierce'`.

### Input Handling
- **Click**: Find row at `(mouseY + scrollY)`. Create an HTML `<input>` element overlaid on the canvas at the row's value column position, pre-filled with current value.
- **Blur / Enter on input**: Parse value, call `setOverride(...)`, remove HTML element, rebuild field list.
- **Scroll**: Update `scrollY`, clamp to content height.
- **Tab click**: Change `activeTab`, reset `scrollY`, rebuild fields.
- **Export button click**: Call `exportJSON()`, trigger browser download.
- **Import button click**: Create hidden `<input type="file" accept=".json">`, trigger click, on change call `importJSON()`.
- **Reset button click**: Call `resetAllOverrides()`, rebuild fields.

---

## `src/renderer.js` — `drawConfigEditor(state)`

Draws the config editor UI on canvas. The HTML input overlay is managed by `configEditor.js` directly (not drawn on canvas).

### Layout
```
[Tab bar: Global | Enemies | Weapons | Passives | Characters | Upgrades]
[Scrollable field list]
  Label ..................... value
  Label ..................... value
[Export JSON]  [Import JSON]  [Reset Defaults]  [← Back]
```

- Tab bar: horizontal row of buttons at top
- Field list: two columns — label (left) + value (right, clickable area)
- Buttons at bottom fixed (not scrolling)
- Active tab button highlighted
- Clickable value column shows cursor change on hover (tracked via mousemove)

---

## Game State Integration (`src/game.js`)

### New State: `config_editor`
- Added to state machine alongside `menu`, `shop`, `characters`
- Menu: add "設定配置" button that transitions to `config_editor`
- Input: in `config_editor` state, route mouse/touch events to `configEditor.handleInput()`
- Update: no game-logic update in `config_editor` state
- Render: call `renderer.drawConfigEditor(configEditorState)`
- "Back" button in editor transitions back to `menu`

---

## Export / Import

### Export
```js
function exportJSON() {
  const full = { config: getConfig(), enemies: getEnemyTypes(), ... };
  const str = JSON.stringify(full, null, 2);
  // create <a href="data:application/json,..."> and click it
}
```

### Import
```js
function importJSON(str) {
  const parsed = JSON.parse(str);
  // validate top-level keys
  // store as override (extract only the override delta vs defaults)
  localStorage.setItem('crazygaga_config_override', JSON.stringify(delta));
  reloadCache();
}
```

Import accepts full config exports (as produced by Export). It diffs against defaults to compute and store only the delta, keeping storage minimal.

---

## Testing

`tests/gameConfig.test.js`:
- Override merging: enemy override changes only specified fields, others keep defaults
- Nested override: `config.player.maxHp` override works without affecting other player fields
- Reset: after `resetAllOverrides()`, all accessors return original defaults
- Export/import round-trip: export → import produces identical merged config
- Import invalid JSON: throws, does not corrupt state
