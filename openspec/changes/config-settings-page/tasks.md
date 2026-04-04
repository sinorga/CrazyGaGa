## 1. Settings Data & Persistence

- [x] 1.1 Create src/settings.js with SETTINGS_DEFS array (8 settings with key, label, configPath, min, max, step, default)
- [x] 1.2 Implement loadSettings(), saveSettings(), resetSettings(), applyUserSettings() functions with localStorage
- [x] 1.3 Write tests/settings.test.js: load/save/reset/apply, clamping, fallback on error

## 2. Game State Machine

- [x] 2.1 Add 'settings' state to game.js state machine
- [x] 2.2 Add handleClick logic for settings state (slider interaction, back button, reset button)
- [x] 2.3 Modify menu handleClick to detect "設定" button tap and transition to settings

## 3. Renderer

- [x] 3.1 Add "設定" button to drawMenu()
- [x] 3.2 Implement drawSettingsPage() with title, slider rows, value labels, back button, reset button
- [x] 3.3 Add scrolling support for settings page if content exceeds screen height

## 4. Integration

- [x] 4.1 Wire settings state rendering into index.html render loop
- [x] 4.2 Call applyUserSettings() on page load in index.html before Game instantiation
- [x] 4.3 Apply cooldown multiplier to weapons at game start in game.js
- [x] 4.4 Run all tests, commit and push
