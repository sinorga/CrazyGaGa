# Design: dual-mode-selection

## Architecture Overview

The key principle is **additive, not destructive**: restore the survivor-mode infrastructure alongside the existing Archero code. A single `game.mode` field routes all divergent logic.

```
game.mode: 'archero' | 'survivor'
```

### Files changed

| File | Change |
|---|---|
| `src/spawner.js` | RESTORED (was deleted in v2.0.0) |
| `src/config.js` | Add back `map.*` and `waves.*` blocks |
| `src/game.js` | Add `mode` field; branch on mode in start/update/click |
| `src/player.js` | `move()` accepts optional canvas dims; falls back to map clamp |
| `src/renderer.js` | Route `drawMap` vs `drawRoom` based on mode arg |
| `src/main.js` | Pass mode to renderer; show mode-select UI |

---

## Config Changes (`src/config.js`)

Restore the removed blocks alongside the new `room` block:

```js
// Map (survivor mode)
map: {
  width: 3000,
  height: 3000,
  gridSize: 100,
  gridColor: 'rgba(255,255,255,0.03)',
  borderColor: '#ff4444',
  borderWidth: 4,
},

// Camera (survivor mode)
camera: {
  lerp: 0.08,
},

// Wave spawning (survivor mode)
waves: {
  initialDelay: 1,
  spawnInterval: 2.5,
  minSpawnInterval: 0.5,
  spawnIntervalDecay: 0.99,
  enemiesPerWave: 2,
  enemiesPerWaveGrowth: 0.3,
  maxEnemies: 80,
  spawnDistanceMin: 400,
  spawnDistanceMax: 600,
  bossKillThreshold: 100,
  victoryKills: 500,
},
```

---

## Main Menu Mode Selection

Add two mode buttons below the existing "點擊開始遊戲" prompt:

```
[ 🏹 地城模式 ]   [ ⚔️ 生存模式 ]
```

Clicking a mode button calls `game.startGame(mode)`.

Layout: two buttons centered, each ~160px wide, 50px tall, with gap.

---

## `game.js` Changes

### `startGame(mode)`

```js
startGame(mode = 'archero') {
  this.mode = mode;
  // ...existing reset logic...

  if (mode === 'archero') {
    this.roomManager.reset();
    const initial = this.roomManager.enterRoom(this);
    this.enemies.push(...initial);
    this._spawnRoomObjects();
    this.player.reset(canvas.width / 2, canvas.height * cfg.room.playerStartYFraction);
  } else {
    this.spawner.reset();
    this.player.reset(cfg.map.width / 2, cfg.map.height / 2);
    this.nextBossKills = cfg.waves.bossKillThreshold;
    this.bossPhase = 0;
  }
}
```

### `updatePlaying(dt)` routing

```js
// Player movement clamping
if (this.mode === 'archero') {
  this.player.move(dir, dt, canvas.width, canvas.height);
} else {
  this.player.move(dir, dt); // survivor: uses map bounds
}

// Enemy spawning
if (this.mode === 'archero') {
  const newEnemies = this.roomManager.update(dt, enemies, player, this);
  // ... door check, room objects ...
} else {
  // Boss threshold spawn
  // this.spawner.update(...)
}

// Victory / game-over
if (this.mode === 'survivor' && player.kills >= cfg.waves.victoryKills) {
  this.triggerVictory();
}
```

### `handleClick(x, y)` routing

In `'menu'` state, detect which mode button was clicked and call `startGame('archero')` or `startGame('survivor')`.

`selectSkill()`: already handles both `levelup` (survivor uses this) and `roomclear` states.

`triggerLevelUp()` uses `'levelup'` pool for both modes — survivor's level-up is stat passives only, which is correct.

---

## `player.js` Changes

`move(direction, dt, canvasW, canvasH)` — already updated in v2.0.0.

For survivor mode, pass `undefined` for `canvasW/H` → falls back to map clamp:

```js
const wall = getConfig().room?.wallThickness ?? 0;
const mapW = getConfig().map?.width ?? (canvasW ?? 800);
const mapH = getConfig().map?.height ?? (canvasH ?? 600);
const minX = (canvasW ? wall : 0) + this.radius;
// ...
```

Simpler: just use `map.width/height` when `canvasW` is not provided.

---

## `renderer.js` Changes

`drawMap(camera)` — restored (was replaced by `drawRoom`). Both methods coexist.

---

## `main.js` Changes

```js
function render() {
  // ...menu/shop/characters/config_editor...

  const cam = renderer.applyShake(game.camera);
  renderer.clear(cam);

  if (game.mode === 'archero') {
    renderer.drawRoom(game.roomManager, cam);
    renderer.drawDoor(game.roomManager, game.elapsed);
    renderer.drawChests(game.chests, cam, game.elapsed);
    renderer.drawBarrels(game.barrels, cam);
  } else {
    renderer.drawMap(cam);
  }

  // ... shared rendering ...

  if (game.mode === 'archero') {
    renderer.drawChapterHUD(game.roomManager);
  }

  // ... panels, overlays ...
  if (game.state === 'victory') {
    renderer.drawVictory(game.player, game.elapsed, canvas, game.runGold);
  }
}
```

---

## `spawner.js` Restoration

Restore the exact pre-v2.0.0 `WaveSpawner` class. It reads from `getConfig().waves.*` and `getConfig().map.*`.

---

## State Machine (updated)

```
menu ──► [mode select] ──► startGame('archero') ──► archero states
                      └──► startGame('survivor') ──► survivor states
```

Archero states: `playing → roomclear → playing | levelup → playing | chapterclear → menu | gameover → menu`

Survivor states: `playing → levelup → playing | paused → playing | gameover → menu | victory → menu`

---

## Testing

- Existing 265 tests should still pass (no destructive changes)
- Add `tests/dual-mode.test.js`: startGame('archero') uses roomManager; startGame('survivor') uses spawner; mode-select buttons in handleClick route correctly
