## 1. Player Entity

- [x] 1.1 Create src/player.js: Player class with position, HP, stats, movement, damage, invincibility, regen. Write tests first.
- [x] 1.2 Create tests/player.test.js: movement, damage, invincibility, stat modifiers, boundary clamping, death condition

## 2. Enemy System

- [x] 2.1 Create src/enemy.js: Enemy class with position, HP, type-driven stats. Behavior functions for charger, shooter, tank, exploder. Write tests first.
- [x] 2.2 Create src/spawner.js: WaveSpawner class with time-based spawning, escalation, enemy type unlocking, max cap. Write tests first.
- [x] 2.3 Create tests/enemy.test.js and tests/spawner.test.js

## 3. Projectile & Pickup Entities

- [x] 3.1 Create src/projectile.js: Projectile class with movement, pierce, out-of-bounds removal. Write tests first.
- [x] 3.2 Create src/pickup.js: Pickup class (EXP gems) with magnetic attraction and collection. Write tests first.
- [x] 3.3 Create tests/projectile.test.js and tests/pickup.test.js

## 4. Weapon System

- [x] 4.1 Create src/weapons.js: WeaponManager class, weapon instance state (cooldown, level). Implement projectile and orbit weapon patterns. Write tests first.
- [x] 4.2 Create tests/weapons.test.js: auto-attack toggle, cooldown, projectile creation, orbit positioning, weapon leveling

## 5. Progression System

- [x] 5.1 Implement EXP accumulation, level-up threshold calculation, and skill application logic in Player. Write tests first.
- [x] 5.2 Progression tests included in tests/player.test.js (experience section)

## 6. Game Loop & State Machine

- [x] 6.1 Create src/game.js: Game class with fixed timestep loop, state machine (menu/playing/levelup/gameover), entity orchestration
- [x] 6.2 Create tests/game.test.js: state transitions, update delegation per state, reset on restart

## 7. Renderer & UI

- [x] 7.1 Create src/renderer.js: camera follow, map grid/border, entity rendering (player, enemies, projectiles, pickups, particles), HUD, level-up panel, game-over overlay, joystick
- [x] 7.2 UI consolidated into renderer.js (immediate-mode Canvas rendering)
- [x] 7.3 Create index.html: full-viewport Canvas, responsive resize, ES module imports, game initialization

## 8. Integration & Smoke Test

- [x] 8.1 Wire all systems together in game.js: collision detection loop, damage application, pickup collection, wave spawning
- [x] 8.2 Run all tests (141 passing), verify integration
- [ ] 8.3 Commit and push the complete MVP
