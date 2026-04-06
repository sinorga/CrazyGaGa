# Design: archero-full-conversion

## Architecture Overview

```
src/data/chapters.js     ← NEW: chapter definitions (ordered room lists)
src/data/rooms.js        ← NEW: room templates (enemy wave compositions)
src/roomManager.js       ← NEW: replaces WaveSpawner; owns dungeon state
src/chest.js             ← NEW: chest entity (treasure room reward)
src/spawner.js           ← REMOVED (replaced by roomManager.js)
src/config.js            ← UPDATED: room dimensions, door config, new skill params
src/data/skills.js       ← UPDATED: add 10 Archero-style abilities
src/data/enemies.js      ← UPDATED: add Shielder, Healer, Dasher types + 2 new bosses
src/projectile.js        ← UPDATED: wall bounce logic
src/pickup.js            ← UPDATED: add type:'hp' heart pickups
src/game.js              ← UPDATED: new states, RoomManager integration, roomclear flow
src/renderer.js          ← UPDATED: draw room walls, door, chapter/room HUD, chest
src/player.js            ← UPDATED: thorns/vampire stat fields
src/weapons.js           ← UPDATED: diagonal/side/back arrow fire patterns
```

---

## Phase 1 — Room-Based Structure

### `src/data/chapters.js`

Defines each chapter as metadata + an ordered array of room template IDs.

```js
export const CHAPTERS = [
  {
    id: 1,
    name: '幽暗森林',
    rooms: [
      'ch1_r1', 'ch1_r2', 'ch1_r3', 'ch1_r4',
      'ch1_r5', 'ch1_r6', 'ch1_r7', 'ch1_r8',
      'ch1_r9', 'ch1_r10', 'ch1_r11', 'ch1_treasure',
      'ch1_boss',
    ],
    difficultyScale: 1.0,
  },
  {
    id: 2,
    name: '熔岩洞窟',
    rooms: [ /* 12 rooms + treasure + boss */ ],
    difficultyScale: 1.5,
  },
  {
    id: 3,
    name: '冰封神殿',
    rooms: [ /* 12 rooms + treasure + boss */ ],
    difficultyScale: 2.2,
  },
];
```

### `src/data/rooms.js`

Each room template defines:
- `id`: unique string
- `type`: `'normal'` | `'elite'` | `'treasure'` | `'boss'`
- `waves`: array of wave objects `{ enemies: [{ typeId, count }], delay }` — enemies spawn at room start (wave 0) and optionally after a delay (wave 1+)
- `obstacles`: array of `{ x, y }` positions (as % of arena width/height) for barrels

```js
export const ROOM_TEMPLATES = [
  {
    id: 'ch1_r1',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 6 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_r3',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 4 }, { typeId: 'fast_bat', count: 4 }], delay: 0 },
      { enemies: [{ typeId: 'skeleton', count: 3 }], delay: 8 },
    ],
    obstacles: [{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.6 }],
  },
  // ... all rooms for chapters 1-3
];
```

### `src/roomManager.js`

Replaces `WaveSpawner`. Owns chapter/room progression.

```js
export class RoomManager {
  constructor() {
    this.chapterIndex = 0;   // index into CHAPTERS array
    this.roomIndex = 0;       // index into chapter.rooms array
    this.state = 'entering';  // 'entering' | 'fighting' | 'cleared' | 'transitioning'
    this.pendingWaves = [];   // scheduled waves not yet spawned
    this.waveTimer = 0;
    this.doorOpen = false;
    this.doorAnim = 0;        // 0..1 animation progress
    this.playerInDoor = false;
  }

  get currentChapter() { return CHAPTERS[this.chapterIndex]; }
  get currentRoomId()   { return this.currentChapter.rooms[this.roomIndex]; }
  get currentTemplate() { return ROOM_TEMPLATES.find(r => r.id === this.currentRoomId); }
  get isLastRoom()      { return this.roomIndex >= this.currentChapter.rooms.length - 1; }
  get isBossRoom()      { return this.currentTemplate?.type === 'boss'; }
  get isTreasureRoom()  { return this.currentTemplate?.type === 'treasure'; }

  // Call once when entering a new room
  enterRoom(game) { ... }

  // Returns array of new Enemy instances to add this frame
  update(dt, enemies, player, game) { ... }

  // Called by game._onEnemyDeath; checks if room is cleared
  onEnemyDeath(enemies) { ... }

  // Called when player overlaps exit door hitbox
  onPlayerReachDoor(game) { ... }

  // Advance to next room (called after ability selection)
  advanceRoom(game) { ... }

  // Advance to next chapter
  advanceChapter(game) { ... }

  reset() { ... }
}
```

**Enemy spawn positions**: Enemies spawn from random points along the 4 walls, at least 80px from corners, clustered in groups of up to 4 to avoid clumping.

**Exit door**: Appears at the top-center of the arena when `state === 'cleared'`. Hitbox: 80×60px. When player overlaps it, `game.state` transitions to `'roomclear'` (ability selection). For boss room, door leads to chapter complete screen.

### Room Arena Layout

The room fills the full canvas. No camera scroll.

```
CONFIG.room = {
  wallThickness: 20,      // px
  wallColor: '#334',
  floorColor: '#1a1a2e',
  doorWidth: 80,
  doorHeight: 60,
  doorColor: '#ffdd44',
  playerStartY: 0.8,      // fraction of arena height (near bottom)
}
```

Arena play area: `canvas.width × canvas.height` with `wallThickness` inset on all sides. Player starts near the bottom-center on room entry.

### `src/config.js` changes

Remove: `map.width`, `map.height`, `map.gridSize`, `map.gridColor`, `map.borderColor`, `map.borderWidth`, `waves.*`  
Add: `room.*` block (see above), `combat.wallBounces: 0` (base bounces)

---

## Phase 2 — Archero Skills & Wall Bounce

### Projectile Wall Bounce (`src/projectile.js`)

Add `bounces` property (integer). On each `update()` tick:
1. Check if projectile crosses wall boundary (inset by `wallThickness`).
2. If crossing left/right wall: `vx = -vx`, clamp x, decrement `bounces`.
3. If crossing top/bottom wall: `vy = -vy`, clamp y, decrement `bounces`.
4. If `bounces < 0` and out of bounds: `alive = false`.

Ricochet variant: instead of reflecting off wall, find nearest alive enemy not in `hitSet` and redirect velocity toward it.

### New Skills (`src/data/skills.js`)

| id | name | category | effect |
|---|---|---|---|
| `skill_diagonal` | 斜角射擊 | weapon_modifier | On each shot, fire 2 extra arrows at ±45° from primary direction |
| `skill_side_arrow` | 側翼箭矢 | weapon_modifier | Fire 1 arrow left + 1 arrow right perpendicular to aim |
| `skill_back_arrow` | 背後箭矢 | weapon_modifier | Fire 1 arrow in the exact opposite direction of aim |
| `skill_multishot` | 多重射擊 | weapon_modifier | Spread 3 arrows in a 30° fan (replaces single shot) |
| `skill_bounce` | 彈射箭矢 | weapon_modifier | Arrows bounce off walls 2 times |
| `skill_ricochet` | 追蹤彈射 | weapon_modifier | Arrows ricochet to nearest enemy on wall hit |
| `skill_freeze` | 冰凍術 | passive | 15% chance to freeze enemy for 1.2s on hit |
| `skill_poison` | 毒霧 | passive | Hits apply 3 DPS poison for 3s |
| `skill_heal_on_kill` | 嗜血 | passive | Recover 2 HP per kill |
| `skill_thorns` | 荊棘護甲 | passive | Reflect 15% of contact damage back to attacker |
| `skill_vampire` | 吸血 | passive | Lifesteal 8% of damage dealt |

**Implementation of weapon modifiers**: The `weapons.js` `_updateProjectile` function reads `player.skillLevels` to determine extra arrows to fire. Each modifier stacks additively (e.g., `diagonal` + `side_arrow` fires 5 arrows total per shot).

**Freeze/Poison/Stun** stored on enemy instance: `enemy.frozen` (timer), `enemy.poisoned` (timer + dps). Processed in `enemy.update()`.

---

## Phase 3 — HP Pickups & Chests

### HP Pickup (`src/pickup.js`)

Add `type` field. Existing gem pickups keep `type: 'gem'`. New: `type: 'hp'`.

```js
// In _onEnemyDeath (game.js):
if (Math.random() < 0.05) {
  this.pickups.push(new Pickup(enemy.x, enemy.y, 0, 'hp'));
}
// Boss always drops:
this.pickups.push(new Pickup(enemy.x, enemy.y, 0, 'hp', 'large'));
```

Pickup collection in `game.js` checks type:
```js
if (pickup.type === 'hp') {
  this.player.hp = Math.min(this.player.maxHp, this.player.hp + pickup.hpValue);
} else {
  this.player.addExp(pickup.value);
}
```

HP values: normal heart = 20 HP, large potion = 40 HP.

### `src/chest.js`

```js
export class Chest {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = 18;
    this.open = false;
    this.alive = true;
  }

  tryOpen(player) {
    if (this.open) return null;
    const dx = player.x - this.x, dy = player.y - this.y;
    if (dx*dx + dy*dy < (this.radius + player.radius) ** 2) {
      this.open = true;
      return this._roll();
    }
    return null;
  }

  _roll() {
    const r = Math.random();
    if (r < 0.4) return { type: 'hp', value: 60 };
    if (r < 0.7) return { type: 'gold', value: 30 };
    return { type: 'scroll' }; // random ability from pool
  }
}
```

Treasure room: `RoomManager.enterRoom` spawns one `Chest` at arena center. No enemies. Door is pre-opened. Chest reward of `type:'scroll'` triggers ability selection UI immediately.

---

## Phase 4 — Between-Room Ability Selection

### New Game State: `roomclear`

Added to state machine in `game.js` alongside existing states.

**Trigger**: `RoomManager.onPlayerReachDoor()` calls `game.triggerRoomClear()`.

```js
triggerRoomClear() {
  if (this.state !== 'playing') return;
  this.state = 'roomclear';
  this.skillChoices = getRandomSkillChoices(
    CONFIG.leveling.choiceCount,
    this.player.skillLevels,
    'archero'   // new pool filter: only Archero-style abilities
  );
}
```

**UI**: Reuses `renderer.drawLevelUpPanel()` with a different title label ("選擇技能" instead of "升級！"). Handled in `renderer.drawRoomClearPanel()` which calls the same card-drawing logic.

**On selection**: `game.selectSkill(index)` applies the skill, then calls `this.roomManager.advanceRoom(this)` which transitions the room.

### Skill Pool Split

`getRandomSkillChoices` gains an optional `pool` parameter:
- `'levelup'`: passive stat boosts only (HP, speed, damage, armor, regen, pickup range, exp bonus) — shown on hero level-up
- `'archero'`: Archero weapon modifiers + status effects — shown on room clear
- `undefined` / default: all skills (backward compatible)

---

## Phase 5 — Polish & Content

### Obstacle / Barrel System

Barrels (`src/barrel.js`):
```js
export class Barrel {
  constructor(x, y) { this.x=x; this.y=y; this.radius=14; this.hp=30; this.alive=true; }
  takeDamage(dmg) { this.hp -= dmg; if(this.hp<=0) this.alive=false; }
}
```

- Barrels block enemy movement (collision resolution same as wall).
- Projectiles hitting a barrel deal damage and stop (no pierce through barrels).
- On death: small explosion (particles), no drop.

### HUD Updates (`src/renderer.js`)

- Top-center: `Chapter 1 · Room 3 / 13` in small gold text.
- Below HUD: row of 13 small dots; completed rooms = filled gold, current = pulsing white, remaining = dim grey.
- Door open animation: door color fades from dark to bright gold over 0.5s, with particle sparkle.
- Room-clear celebration: 20-particle burst from door position in gold.

### New Enemy Types (`src/data/enemies.js`)

| id | name | type | notes |
|---|---|---|---|
| `shielder` | 盾兵 | `shielder` | New behavior: blocks projectiles from frontal 120° arc; must be hit from sides/behind |
| `healer` | 治療師 | `healer` | Restores 5 HP/sec to the lowest-HP enemy within 150px |
| `dasher` | 衝刺者 | `dasher` | Stands still for 1.5s then dashes at player at 400px/s; repeats |

New boss behaviors in `src/boss.js`:
- **Phase transition at 50% HP**: changes color, increases speed by 30%, adds new attack pattern.
- `boss_dragon` (Chapter 3): fire breath (cone area), wing gust (pushes player), tail sweep (360° melee).
- `boss_lich_king` (Chapter 4): ice nova, summon army, teleport + silence (disables player shooting for 2s).

---

## State Machine (updated `game.js`)

```
menu ──► shop
     ├─► characters
     ├─► config_editor
     └─► playing ──► roomclear ──► playing (next room)
              ├─► levelup ──► playing
              ├─► paused ──► playing
              ├─► gameover ──► menu
              └─► chapterclear ──► menu (with reward screen)
```

---

## Key File Change Summary

| File | Change Type | Summary |
|---|---|---|
| `src/data/chapters.js` | NEW | Chapter definitions |
| `src/data/rooms.js` | NEW | Room templates for chapters 1–3 |
| `src/roomManager.js` | NEW | Replaces WaveSpawner |
| `src/chest.js` | NEW | Chest entity |
| `src/barrel.js` | NEW | Barrel obstacle entity |
| `src/spawner.js` | REMOVED | Replaced by roomManager.js |
| `src/config.js` | UPDATED | Remove map/waves, add room config |
| `src/data/skills.js` | UPDATED | +11 Archero skills, pool tagging |
| `src/data/enemies.js` | UPDATED | +Shielder, Healer, Dasher, 2 bosses |
| `src/projectile.js` | UPDATED | Wall bounce logic |
| `src/pickup.js` | UPDATED | HP pickup type |
| `src/game.js` | UPDATED | RoomManager, roomclear state, chest/barrel handling |
| `src/renderer.js` | UPDATED | Room walls, door, chapter HUD, chest/barrel draw |
| `src/player.js` | UPDATED | thorns/vampire/freeze/poison stat fields |
| `src/weapons.js` | UPDATED | Diagonal/side/back/multishot fire patterns |
| `src/enemy.js` | UPDATED | Frozen/poisoned status effects, shielder/healer/dasher behaviors |

---

## Testing

`tests/roomManager.test.js`:
- Room enters fighting state when enemies spawn
- Room transitions to cleared when last enemy dies
- Door appears only when cleared
- advanceRoom increments roomIndex
- Chapter advance resets roomIndex and increments chapterIndex

`tests/projectile.test.js`:
- Projectile with bounces=1 reflects off left wall
- Projectile with bounces=0 dies on wall contact
- Bounce decrements counter each reflection

`tests/pickup.test.js`:
- HP pickup restores player.hp by hpValue
- HP pickup does not exceed maxHp
- Gem pickup still adds EXP as before

`tests/skills.test.js`:
- diagonal skill fires 2 extra projectiles per shot
- side_arrow fires perpendicular projectiles
- freeze skill applies frozen status at correct probability
- poison applies dps over time
