# Tasks: dual-mode-selection

## Task 1 — Restore survivor infrastructure in config and spawner

### 1.1 Add map/camera/waves blocks back to `src/config.js`

Insert after the existing `room` block:

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

### 1.2 Restore `src/spawner.js`

Create `src/spawner.js` with the pre-v2.0.0 `WaveSpawner` class that reads from `getConfig().waves.*` and `getConfig().map.*`. Must export `WaveSpawner`. Key responsibilities:
- `reset()`: resets timer/interval/count
- `update(dt, enemies, player, spawnFn)`: spawns waves on timer, calls `spawnFn(typeId, x, y)` for each enemy
- Uses `spawnDistanceMin/Max` around player position clamped to map bounds
- Tracks `this.spawnInterval`, decays it by `spawnIntervalDecay` each wave
- Caps active enemies at `maxEnemies`

## Task 2 — Update `src/game.js` for dual-mode routing

### 2.1 Import WaveSpawner and add mode field

Add to imports:
```js
import { WaveSpawner } from './spawner.js';
```

Add to constructor:
```js
this.mode = 'archero'; // 'archero' | 'survivor'
this.spawner = new WaveSpawner();
this.nextBossKills = 0;
this.bossPhase = 0;
this.camera = { x: 0, y: 0 };
```

### 2.2 Update `startGame(mode = 'archero')`

Set `this.mode = mode` at the top, then branch:

```js
if (mode === 'archero') {
  this.roomManager.reset();
  // ...existing archero init...
} else {
  this.spawner.reset();
  const cfg = getConfig();
  this.player.reset(cfg.map.width / 2, cfg.map.height / 2);
  this.nextBossKills = cfg.waves.bossKillThreshold;
  this.bossPhase = 0;
  this.camera = { x: cfg.map.width / 2, y: cfg.map.height / 2 };
}
```

### 2.3 Branch `updatePlaying(dt)` on mode

Player movement:
```js
if (this.mode === 'archero') {
  this.player.move(dir, dt, canvas.width, canvas.height);
} else {
  this.player.move(dir, dt); // survivor: map bounds fallback
}
```

Enemy spawn/room update:
```js
if (this.mode === 'archero') {
  // existing roomManager.update(), door check, room objects
} else {
  this.spawner.update(dt, this.enemies, this.player, (typeId, x, y) => {
    this._spawnEnemy(typeId, x, y);
  });
  this._updateCamera(dt);
  if (this.player.kills >= getConfig().waves.victoryKills) {
    this.triggerVictory();
  }
}
```

### 2.4 Restore `_updateCamera(dt)` for survivor mode

```js
_updateCamera(dt) {
  const cfg = getConfig();
  const lerp = cfg.camera.lerp;
  const canvas = this._canvas;
  const targetX = this.player.x - canvas.width / 2;
  const targetY = this.player.y - canvas.height / 2;
  const maxX = cfg.map.width - canvas.width;
  const maxY = cfg.map.height - canvas.height;
  this.camera.x += (Math.max(0, Math.min(maxX, targetX)) - this.camera.x) * lerp;
  this.camera.y += (Math.max(0, Math.min(maxY, targetY)) - this.camera.y) * lerp;
}
```

### 2.5 Restore `triggerVictory()` for survivor mode

```js
triggerVictory() {
  this.state = 'victory';
}
```

### 2.6 Update `handleClick(x, y)` for mode buttons

In the `'menu'` state handler, detect clicks on mode buttons:
- 地城模式 button (archero): calls `this.startGame('archero')`
- 生存模式 button (survivor): calls `this.startGame('survivor')`

Store button rects as instance fields or calculate from canvas center so renderer and game agree on positions.

## Task 3 — Update `src/player.js` for survivor map bounds

`move(direction, dt, canvasW, canvasH)` already exists. Survivor mode passes `undefined` for both dims.

Update the clamping logic to fall back to map dimensions:

```js
const cfg = getConfig();
const wall = cfg.room?.wallThickness ?? 0;
const boundsW = canvasW ?? cfg.map?.width ?? 800;
const boundsH = canvasH ?? cfg.map?.height ?? 600;
const minX = (canvasW != null ? wall : 0) + this.radius;
const maxX = boundsW - (canvasW != null ? wall : 0) - this.radius;
const minY = (canvasW != null ? wall : 0) + this.radius;
const maxY = boundsH - (canvasW != null ? wall : 0) - this.radius;
```

## Task 4 — Update `src/renderer.js` for dual-mode rendering

### 4.1 Restore `drawMap(camera)`

Re-add the pre-v2.0.0 `drawMap(camera)` method that draws:
- Floor fill with `cfg.canvas.backgroundColor`
- Grid lines spaced `cfg.map.gridSize` apart (offset by camera)
- Border rect at map edges (4px `cfg.map.borderColor`)

### 4.2 Add mode buttons to `drawMenu(canvas)`

Draw two side-by-side buttons below the "點擊開始遊戲" text:
- Left: "🏹 地城模式" (archero)
- Right: "⚔️ 生存模式" (survivor)
- Each ~160px wide × 50px tall, centered, 20px gap

Store button rects on the renderer instance (e.g., `this.menuArcheroBtn`, `this.menuSurvivorBtn`) so `game.js` can read them for hit-testing.

### 4.3 Restore `drawVictory(player, elapsed, canvas, runGold)`

Re-add the victory screen renderer (was removed in v2.0.0).

## Task 5 — Update `src/main.js` for mode-aware render loop

Branch environment rendering on `game.mode`:

```js
if (game.mode === 'archero') {
  renderer.drawRoom(game.roomManager, cam);
  renderer.drawDoor(game.roomManager, game.elapsed);
  renderer.drawChests(game.chests, cam, game.elapsed);
  renderer.drawBarrels(game.barrels, cam);
} else {
  renderer.drawMap(cam);
}
```

Chapter HUD only for archero:
```js
if (game.mode === 'archero') {
  renderer.drawChapterHUD(game.roomManager);
}
```

Victory panel (survivor):
```js
if (game.state === 'victory') {
  renderer.drawVictory(game.player, game.elapsed, canvas, game.runGold);
}
```

## Task 6 — Restore survivor tests

### 6.1 Restore `tests/config.test.js` map/waves checks

Add tests verifying `CONFIG.map`, `CONFIG.waves`, and `CONFIG.camera` exist and have valid values.

### 6.2 Add `tests/dual-mode.test.js`

Tests:
- `startGame('archero')` sets `game.mode === 'archero'` and initializes roomManager
- `startGame('survivor')` sets `game.mode === 'survivor'` and initializes spawner
- Mode defaults to `'archero'` when no argument passed
- Player position after archero start is near canvas center
- Player position after survivor start is near map center

## Task 7 — Version bump and commit

- Bump version to `2.1.0` in `src/config.js` and `index.html` (new feature)
- Commit all changes on branch `claude/openspec-apply-ynQPc`
- Push to origin
