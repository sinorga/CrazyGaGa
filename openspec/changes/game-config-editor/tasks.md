## 1. Runtime Config Layer

- [x] 1.1 Create `src/gameConfig.js`: import all static defaults, deep-merge localStorage override on load, export `getConfig()`, `getEnemyTypes()`, `getWeaponDefs()`, `getSkillDefs()`, `getCharacterDefs()`, `getUpgradeDefs()`, `getEvolutionRecipes()`
- [x] 1.2 Add mutation API to `src/gameConfig.js`: `setOverride(section, id, fieldPath, value)`, `resetAllOverrides()`, `exportJSON()`, `importJSON(str)`, `reloadCache()`

## 2. Wire Consumers to gameConfig

- [x] 2.1 Update `src/spawner.js`: replace direct `data/enemies.js` imports with `getEnemyTypes()` from `gameConfig.js`
- [x] 2.2 Update `src/boss.js`: replace `getBossForPhase` import with lookup via `getEnemyTypes()` from `gameConfig.js`
- [x] 2.3 Update `src/player.js`: replace `CONFIG` import with `getConfig()` from `gameConfig.js`
- [x] 2.4 Update `src/weapons.js`: replace `getWeaponDefinition` import with `getWeaponDefs()` from `gameConfig.js`
- [x] 2.5 Update `src/game.js`: replace all static imports (`CONFIG`, data files) with `gameConfig.js` accessors
- [x] 2.6 Update `src/meta.js`: replace `CHARACTER_DEFINITIONS`, `UPGRADE_DEFINITIONS` imports with `getCharacterDefs()`, `getUpgradeDefs()`
- [x] 2.7 Update `src/settings.js`, `src/renderer.js`, `src/particles.js`: replace `CONFIG` import with `getConfig()`

## 3. Config Editor Module

- [x] 3.1 Create `src/configEditor.js`: editor state (`activeTab`, `scrollY`, `fields`, `activeInput`), `buildFields(tab)` that produces `{ label, value, fieldKey, type }` rows for all 6 tabs
- [x] 3.2 Implement `handleClick(x, y)` in `configEditor.js`: find clicked row, create HTML `<input>` overlay on canvas at value column position, pre-filled with current value
- [x] 3.3 Implement input commit in `configEditor.js`: on blur/Enter parse value, call `setOverride()`, remove HTML element, rebuild field list
- [x] 3.4 Implement `handleScroll(delta)` and tab switching in `configEditor.js`
- [x] 3.5 Implement export button: call `exportJSON()`, trigger download via `<a href="data:...">` click
- [x] 3.6 Implement import button: create hidden `<input type="file" accept=".json">`, call `importJSON()` on file load, rebuild fields
- [x] 3.7 Implement reset button: call `resetAllOverrides()`, rebuild all fields

## 4. Renderer Integration

- [x] 4.1 Add `drawConfigEditor(editorState)` to `src/renderer.js`: draw tab bar, scrollable two-column field list (label + value), fixed bottom buttons (Export / Import / Reset / Back)
- [x] 4.2 Highlight active tab, show scroll position indicator, mark modified fields (values differing from default) in a distinct color

## 5. Game State Integration

- [x] 5.1 Add `config_editor` to game state machine in `src/game.js`; add "設定配置" button on main menu that transitions to `config_editor`
- [x] 5.2 Route mouse/touch events to `configEditor.handleClick/handleScroll` in `config_editor` state; render via `renderer.drawConfigEditor()`; "Back" button returns to `menu`

## 6. Tests & Validation

- [x] 6.1 Create `tests/gameConfig.test.js`: override merging (partial override, nested path, array item by id), reset restores defaults, export/import round-trip, import invalid JSON throws without corrupting state
- [x] 6.2 Run all tests — expect 228+ pass with new additions
- [x] 6.3 Commit and push
