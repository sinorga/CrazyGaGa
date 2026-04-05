## Phase 1 — Room-Based Structure

### 1.1 Data: Chapters & Room Templates
- [ ] 1.1.1 Create `src/data/chapters.js`: define `CHAPTERS` array with Chapters 1–3, each with an ordered `rooms` array (12 normal/elite rooms + 1 treasure room + 1 boss room) and a `difficultyScale` multiplier
- [ ] 1.1.2 Create `src/data/rooms.js`: define `ROOM_TEMPLATES` array — each template has `id`, `type` (`normal`|`elite`|`treasure`|`boss`), `waves` array (`[{ enemies: [{typeId, count}], delay }]`), and `obstacles` array (barrel positions as `{x, y}` fractions); cover all rooms referenced by chapters.js

### 1.2 RoomManager
- [ ] 1.2.1 Create `src/roomManager.js`: class `RoomManager` with `chapterIndex`, `roomIndex`, `state` (`entering`|`fighting`|`cleared`|`transitioning`), `pendingWaves`, `doorOpen`, `doorAnim` fields
- [ ] 1.2.2 Implement `RoomManager.enterRoom(game)`: load current template, schedule waves in `pendingWaves`, spawn initial wave (delay=0) as `Enemy` instances, set `state = 'fighting'`; for treasure rooms set `state = 'cleared'` and `doorOpen = true` immediately
- [ ] 1.2.3 Implement `RoomManager.update(dt, enemies, player, game)`: tick `waveTimer`; when timer exceeds next wave delay, create and return new enemy instances; apply chapter `difficultyScale` to enemy HP and damage
- [ ] 1.2.4 Implement `RoomManager.onEnemyDeath(enemies)`: count living enemies; when 0 and all waves spawned, set `state = 'cleared'`, set `doorOpen = true`, start `doorAnim`
- [ ] 1.2.5 Implement `RoomManager.onPlayerReachDoor(game)`: call `game.triggerRoomClear()` (normal/elite/treasure) or `game.triggerChapterClear()` (boss room)
- [ ] 1.2.6 Implement `RoomManager.advanceRoom(game)`: increment `roomIndex`; call `enterRoom(game)`
- [ ] 1.2.7 Implement `RoomManager.advanceChapter(game)`: increment `chapterIndex`, reset `roomIndex`; call `enterRoom(game)`
- [ ] 1.2.8 Implement `RoomManager.reset()`: reset all fields to initial state

### 1.3 Config Updates
- [ ] 1.3.1 Update `src/config.js`: remove `map.width`, `map.height`, `map.gridSize`, `map.gridColor`, `map.borderColor`, `map.borderWidth`, and all `waves.*` keys; add `room` block: `{ wallThickness: 20, wallColor: '#334455', floorColor: '#1a1a2e', doorWidth: 80, doorHeight: 60, doorColor: '#ffdd44', playerStartYFraction: 0.8 }`

### 1.4 Game Loop Integration
- [ ] 1.4.1 Update `src/game.js`: replace `WaveSpawner` import with `RoomManager`; add `roomManager` field; add `chapterclear` and `roomclear` to state enum comment
- [ ] 1.4.2 Update `game.startGame()`: call `roomManager.reset()` then `roomManager.enterRoom(this)` instead of `spawner.reset()`
- [ ] 1.4.3 Update `game.updatePlaying(dt)`: replace `spawner.update(...)` call with `roomManager.update(dt, enemies, player, this)`; add player-door overlap check each frame; add barrel update loop
- [ ] 1.4.4 Add `game.triggerRoomClear()`: set `state = 'roomclear'`, generate Archero-pool skill choices
- [ ] 1.4.5 Add `game.triggerChapterClear()`: set `state = 'chapterclear'`, save gold
- [ ] 1.4.6 Update `game.selectSkill()`: after skill applied, call `roomManager.advanceRoom(this)` when coming from `roomclear` state
- [ ] 1.4.7 Update `game.handleClick()`: add `roomclear` state card hit-detection (reuse levelup layout); add `chapterclear` state (click → menu)

### 1.5 Renderer: Room Arena
- [ ] 1.5.1 Update `src/renderer.js` `drawMap()` → rename to `drawRoom(roomManager, camera)`: draw solid floor fill, draw 4 wall rectangles using `CONFIG.room.wallThickness` and `wallColor`; remove old grid and 3000×3000 border drawing
- [ ] 1.5.2 Add `renderer.drawDoor(roomManager)`: draw exit door at top-center of arena; animate from dark to gold using `roomManager.doorAnim`; add particle sparkle when fully open
- [ ] 1.5.3 Add `renderer.drawChapterHUD(roomManager)`: top-center text "Chapter X · Room Y / N"; row of progress dots below kill counter
- [ ] 1.5.4 Add `renderer.drawRoomClearPanel(skillChoices, canvas)`: same card layout as `drawLevelUpPanel` with title "選擇技能"
- [ ] 1.5.5 Add `renderer.drawChapterClear(canvas, chapterNum, runGold)`: full-screen overlay with chapter name, gold earned, tap-to-continue prompt
- [ ] 1.5.6 Update `main.js` render loop: replace `drawMap` with `drawRoom(game.roomManager, cam)` and `drawDoor(game.roomManager)`; add `drawChapterHUD`; handle `roomclear` and `chapterclear` render states

### 1.6 Remove Open-World Artifacts
- [ ] 1.6.1 Delete `src/spawner.js`
- [ ] 1.6.2 Remove all imports of `WaveSpawner` from `game.js`
- [ ] 1.6.3 Remove camera lerp logic from `game.js` (camera is now always `{x:0, y:0}` — room fills canvas)
- [ ] 1.6.4 Remove `CONFIG.waves.victoryKills` win condition from `game.updatePlaying()`

---

## Phase 2 — Archero Skills & Wall Bounce

### 2.1 Projectile Wall Bounce
- [ ] 2.1.1 Update `src/projectile.js`: add `bounces` property (default `0`); in `update(dt)` check collision with room wall boundaries (from `getConfig().room.wallThickness`); on left/right wall hit: `vx = -vx`, clamp x, `bounces--`; on top/bottom wall hit: `vy = -vy`, clamp y, `bounces--`; mark `alive = false` only when `bounces < 0` and out of bounds
- [ ] 2.1.2 Add ricochet variant in `src/projectile.js`: if `this.ricochet` flag is set, on wall contact find nearest enemy not in `hitSet` and redirect velocity toward it instead of reflecting; decrement `bounces`

### 2.2 New Archero Skills
- [ ] 2.2.1 Add 11 new skill definitions to `src/data/skills.js`: `skill_diagonal`, `skill_side_arrow`, `skill_back_arrow`, `skill_multishot`, `skill_bounce`, `skill_ricochet`, `skill_freeze`, `skill_poison`, `skill_heal_on_kill`, `skill_thorns`, `skill_vampire`; tag each with `pool: 'archero'`; tag existing passives with `pool: 'levelup'`
- [ ] 2.2.2 Update `getRandomSkillChoices()` in `src/data/skills.js`: add optional `pool` parameter; filter by `pool` when provided
- [ ] 2.2.3 Update `src/weapons.js` `_updateProjectile()`: read `player.skillLevels` for `skill_diagonal`, `skill_side_arrow`, `skill_back_arrow`, `skill_multishot`; fire extra projectiles accordingly; assign `bounces` from `skill_bounce` level; set `ricochet` flag from `skill_ricochet`
- [ ] 2.2.4 Update `src/player.js`: add `thorns`, `vampire`, `freezeChance`, `poisonDps`, `healOnKill` fields; update `applyPassive()` to handle these stats
- [ ] 2.2.5 Update `src/enemy.js`: add `frozen` (timer), `poisoned` (timer + dps), `stunned` (timer) fields; in `update()`: skip movement/attacks if `frozen > 0` or `stunned > 0`; apply poison damage tick if `poisoned > 0`
- [ ] 2.2.6 Update `game._processCollisions()`: on player projectile hit, roll `player.freezeChance` → set `enemy.frozen`; apply `player.poisonDps` → set `enemy.poisoned`; apply `player.vampire` lifesteal → `player.hp += dmg * vampire`
- [ ] 2.2.7 Update `game._processCollisions()` enemy contact: apply `player.thorns` → `enemy.takeDamage(contactDmg * thorns)`
- [ ] 2.2.8 Update `game._onEnemyDeath()`: if `player.healOnKill > 0`, heal player by `healOnKill` value

---

## Phase 3 — HP Pickups & Chests

### 3.1 HP Pickup
- [ ] 3.1.1 Update `src/pickup.js`: add `type` parameter (default `'gem'`); add `hpValue` field; set `hpValue = 20` for normal heart, `hpValue = 40` for large potion; render heart as 💗 emoji (pulsing, same style as gem)
- [ ] 3.1.2 Update `game._onEnemyDeath()`: roll `Math.random() < 0.05` → drop HP heart; boss death → always drop large HP potion
- [ ] 3.1.3 Update `game.updatePlaying()` pickup collection: branch on `pickup.type`: `'hp'` → restore HP; `'gem'` → add EXP (existing logic)

### 3.2 Chest System
- [ ] 3.2.1 Create `src/chest.js`: class `Chest` with `x`, `y`, `radius`, `open`, `alive`; `tryOpen(player)` checks overlap, marks open, returns reward object `{type, value}` or `{type:'scroll'}`
- [ ] 3.2.2 Update `src/game.js`: add `this.chests = []` array; spawn chest in `RoomManager.enterRoom` for treasure rooms; update chest overlap check in `updatePlaying`; handle reward types: `hp` → heal, `gold` → runGold, `scroll` → `triggerRoomClear()` with scroll ability pool
- [ ] 3.2.3 Add `renderer.drawChests(chests, camera)` in `src/renderer.js`: render closed chest as 📦 emoji, open chest as open variant; add to main render loop

---

## Phase 4 — Between-Room Ability Selection

### 4.1 Room-Clear State
- [ ] 4.1.1 Update `src/game.js` `triggerRoomClear()`: set `state = 'roomclear'`; call `getRandomSkillChoices(3, player.skillLevels, 'archero')`; store in `this.skillChoices`
- [ ] 4.1.2 Update `src/game.js` `triggerLevelUp()`: call `getRandomSkillChoices(3, player.skillLevels, 'levelup')` — passives only
- [ ] 4.1.3 Update `src/game.js` `handleClick()`: add `roomclear` handler matching `levelup` card layout; on selection call `selectSkill(i)` then `roomManager.advanceRoom(this)`
- [ ] 4.1.4 Update `src/renderer.js`: add `drawRoomClearPanel(skillChoices, canvas)` — same card layout as `drawLevelUpPanel` but with "選擇技能" title and gold border
- [ ] 4.1.5 Update `main.js` render loop: handle `game.state === 'roomclear'` → call `renderer.drawRoomClearPanel()`

---

## Phase 5 — Polish & Content

### 5.1 Barrel Obstacles
- [ ] 5.1.1 Create `src/barrel.js`: class `Barrel` with `x`, `y`, `radius=14`, `hp=30`, `alive`; `takeDamage(dmg)` method
- [ ] 5.1.2 Update `src/game.js`: add `this.barrels = []`; spawn barrels from room template `obstacles` array in `enterRoom`; add barrel collision in `_processCollisions` (player projectiles deal damage to barrels; barrels block enemy movement); on barrel death emit explosion particles
- [ ] 5.1.3 Add `renderer.drawBarrels(barrels, camera)` in `src/renderer.js`: render as 🛢️ emoji; add to main render loop

### 5.2 HUD & Visual Polish
- [ ] 5.2.1 Update `src/renderer.js` `drawHUD()`: add chapter/room counter text at top-center; add room progress dot row
- [ ] 5.2.2 Update `src/renderer.js` `drawDoor()`: add `doorAnim` progress-based alpha and particle sparkle when door first opens
- [ ] 5.2.3 Add room-clear particle burst: when door opens, emit 20 gold particles from door position

### 5.3 New Enemy Types
- [ ] 5.3.1 Add `shielder` enemy to `src/data/enemies.js`: radius 16, hp 60, speed 45, damage 14; tag with `behavior.shieldArc: 120` (degrees)
- [ ] 5.3.2 Add `healer` enemy to `src/data/enemies.js`: radius 13, hp 35, speed 35, damage 5; tag with `behavior.healRange: 150, healRate: 5`
- [ ] 5.3.3 Add `dasher` enemy to `src/data/enemies.js`: radius 12, hp 25, speed 60, damage 18; tag with `behavior.dashSpeed: 400, dashInterval: 1.5`
- [ ] 5.3.4 Add `shielder`, `healer`, `dasher` behaviors to `src/enemy.js`; shielder behavior: check angle between enemy-facing and incoming projectile — block if within shieldArc, let through otherwise; healer behavior: find lowest-HP nearby enemy and add HP each tick; dasher behavior: wait `dashInterval` then lunge at player
- [ ] 5.3.5 Update `src/data/enemies.js` existing bosses: add `phaseAt: 0.5` field to boss_demon and boss_lich; in `src/boss.js` `updateBossAI()`: detect HP crossing phaseAt threshold, tint boss red, multiply speed by 1.3, add new attack

### 5.4 New Bosses
- [ ] 5.4.1 Add `boss_dragon` to `src/data/enemies.js`: Chapter 3 boss; bossPhase 3; attacks: `fire_breath` (cone area), `wing_gust` (knockback), `tail_sweep` (360° melee)
- [ ] 5.4.2 Add `boss_lich_king` to `src/data/enemies.js`: Chapter 4 boss; bossPhase 4; attacks: `ice_nova`, `summon_army`, `teleport_silence` (disables player shooting for 2s)
- [ ] 5.4.3 Implement Chapter 3 and 4 boss attack patterns in `src/boss.js`

---

## Phase 6 — Tests & Version Bump

- [ ] 6.1 Create `tests/roomManager.test.js`: room enters fighting state on enterRoom; clears when last enemy dies; doorOpen becomes true on cleared; advanceRoom increments roomIndex; chapter advance increments chapterIndex and resets roomIndex
- [ ] 6.2 Create `tests/projectile.test.js`: bounces=1 reflects off left wall and decrements bounces to 0; bounces=0 projectile dies on wall contact; bounce reflects vx correctly
- [ ] 6.3 Update `tests/pickup.test.js`: HP pickup restores player.hp by hpValue; HP pickup does not exceed maxHp; gem pickup still adds EXP
- [ ] 6.4 Update `tests/skills.test.js` (or create): diagonal skill causes 3 total projectiles per shot; side_arrow fires 2 perpendicular projectiles; freeze skill sets enemy.frozen on probabilistic roll; poison sets enemy.poisoned
- [ ] 6.5 Run `npm test` — fix any failures
- [ ] 6.6 Bump version: `src/config.js` VERSION `1.2.1` → `2.0.0` (major: architecture change); update `index.html` script `?v=` query string to match
- [ ] 6.7 Commit all changes with message "feat: full Archero conversion — room-based dungeon, wall bounce, Archero skills, HP pickups, chests"
- [ ] 6.8 Push to `claude/plan-game-updates-6HlyW`
