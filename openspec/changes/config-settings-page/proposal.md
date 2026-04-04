## Why

Players currently cannot adjust game parameters without modifying source code. A config settings page before game start lets players customize their experience (HP, fire speed, enemy count, etc.) directly from the UI, improving accessibility and replayability.

## What Changes

- Add a "設定" (Settings) button on the main menu screen
- Create a settings page UI with sliders/inputs for key gameplay values
- Persist settings in localStorage so they survive page reloads
- Apply custom values to CONFIG at game start
- Add a "重置" (Reset) button to restore defaults

Configurable values:
- Player HP (50–2000)
- Player speed (50–500)
- Weapon cooldown multiplier (0.1–3.0, lower = faster)
- Enemy spawn interval (0.5–5.0)
- Max enemies on screen (10–300)
- Boss kill threshold (20–500)
- Difficulty HP scaling per minute (0–0.5)
- Difficulty damage scaling per minute (0–0.3)

## Capabilities

### New Capabilities
- `config-ui`: Settings page UI with sliders, value display, localStorage persistence, and reset-to-defaults

### Modified Capabilities
- `renderer`: Add settings page rendering (settings button on menu, settings panel with controls)
- `game-loop`: Add 'settings' state to game state machine, handle transitions menu↔settings

## Impact

- `src/renderer.js`: New `drawSettingsPage()` method, modified `drawMenu()` to show settings button
- `src/game.js`: New 'settings' game state, `handleClick` for settings interactions
- `src/config.js`: New helper to apply user overrides from localStorage
- `index.html`: Wire settings state into render loop
