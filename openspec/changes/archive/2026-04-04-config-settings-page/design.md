## Context

CrazyGaGa uses a centralized `CONFIG` object in `src/config.js` for all tunable values. The game state machine handles `menu | playing | levelup | gameover`. There is no way for players to adjust settings without editing source code.

## Goals / Non-Goals

**Goals:**
- Add a `settings` state to the game state machine
- Render a settings page with sliders for 8 configurable values
- Persist settings in localStorage under key `crazygaga_settings`
- Apply saved settings to CONFIG on page load and game start
- Mobile-friendly touch-based slider interaction
- Traditional Chinese labels

**Non-Goals:**
- Audio/volume settings (Phase 6)
- Control remapping
- Per-run modifiers or difficulty presets
- Server-side persistence

## Decisions

### 1. Settings storage: localStorage with JSON
Store a flat JSON object mapping config keys to values. On page load, read and merge into CONFIG. Simple, no dependencies, works offline.

Alternative: URL query params — rejected, not persistent across sessions.

### 2. Settings UI: Canvas-rendered sliders
Render settings directly on the Canvas, consistent with the existing menu/levelup/gameover screens. Each setting is a labeled row with a horizontal slider and numeric display.

Alternative: HTML overlay — rejected, would break the pure-Canvas approach and add CSS complexity.

### 3. Config application: Mutate CONFIG at load time
Create a `applyUserSettings()` function that reads localStorage and overwrites specific CONFIG fields. Called once on page load, before game instantiation.

Alternative: Pass overrides to Game constructor — rejected, more invasive refactor for minimal benefit.

### 4. Slider interaction: Touch/mouse drag on slider track
Track active slider by touchstart/mousedown position. Update value on move. Release to commit. Same pattern as the virtual joystick.

### 5. Settings key mapping
Each slider maps to a specific CONFIG path:
| Setting Label | CONFIG Path | Range | Default |
|---|---|---|---|
| 玩家血量 | player.maxHp | 50–2000 | 500 |
| 移動速度 | player.speed | 50–500 | 180 |
| 攻速倍率 | (cooldownMultiplier) | 0.1–3.0 | 1.0 |
| 刷怪間隔 | waves.spawnInterval | 0.5–5.0 | 2.5 |
| 最大敵人數 | waves.maxEnemies | 10–300 | 80 |
| Boss擊殺門檻 | waves.bossKillThreshold | 20–500 | 100 |
| 敵人血量增長 | difficulty.hpMultiplierPerMinute | 0–0.5 | 0.1 |
| 敵人傷害增長 | difficulty.damageMultiplierPerMinute | 0–0.3 | 0.05 |

The cooldown multiplier is special — it scales all weapon cooldowns at game start rather than mapping to a single CONFIG field.

## Risks / Trade-offs

- **[Risk] Extreme settings break balance** → Acceptable; this is a single-player game, player freedom is the goal.
- **[Risk] localStorage unavailable in some contexts** → Fall back to defaults silently, no error.
- **[Trade-off] Canvas sliders less accessible than HTML inputs** → Consistent with existing UI approach; keeps architecture simple.
