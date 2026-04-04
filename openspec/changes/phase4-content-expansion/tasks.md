## 1. Difficulty Scaling

- [x] 1.1 Add difficulty config values (hpMultiplierPerMinute, damageMultiplierPerMinute) to CONFIG
- [x] 1.2 Apply difficulty multipliers in spawner when creating enemies. Write tests first.
- [x] 1.3 Create tests/difficulty.test.js: verify multiplier calculation and application at spawn

## 2. Summoner Enemy Behavior

- [x] 2.1 Implement summoner behavior in enemy.js: spawn minions on timer, keep distance. Write tests first.
- [x] 2.2 Wire summoner minion spawning into game.js update loop
- [x] 2.3 Add summoner tests to tests/enemy.test.js

## 3. Boss System

- [x] 3.1 Add boss spawn timer and boss state tracking to game.js (currentBoss, bossPhase, pause regular waves)
- [x] 3.2 Implement boss attack functions: charge, bullet_ring, bullet_spiral, teleport, summon. Write tests first.
- [x] 3.3 Implement boss AI update loop: cycle through attacks based on cooldowns
- [x] 3.4 Create tests/boss.test.js: boss spawning, attack cycling, boss death resumes waves

## 4. Weapon Patterns (Chain, Area, Boomerang)

- [x] 4.1 Fix chain lightning: ensure target selection, chain bouncing, and visual line work end-to-end. Write tests first.
- [x] 4.2 Fix area weapon (holy sword): target random enemies, create persistent damage zones. Write tests first.
- [x] 4.3 Implement boomerang return mechanic: reverse direction at maxRange, return to player. Write tests first.
- [x] 4.4 Create tests/weapon-patterns.test.js: chain bounce count, area ticks, boomerang round-trip

## 5. Weapon Evolution

- [x] 5.1 Create src/data/evolutions.js with evolution recipes (weapon + passive → evolved weapon)
- [x] 5.2 Add evolved weapon definitions to src/data/weapons.js
- [x] 5.3 Implement evolution eligibility check in game.js level-up flow
- [x] 5.4 Implement evolution application: replace base weapon with evolved form
- [x] 5.5 Create tests/evolution.test.js: recipe matching, eligibility, weapon replacement

## 6. Renderer Enhancements

- [x] 6.1 Add boss HP bar rendering (wide bar with boss name at top of screen)
- [x] 6.2 Implement screen shake: random camera offset with decay, triggered on damage
- [x] 6.3 Implement damage flash: semi-transparent red overlay on player hit
- [x] 6.4 Ensure chain lightning visual line renders correctly between targets

## 7. Integration & Testing

- [x] 7.1 Run all unit tests, ensure 141+ tests pass with new additions
- [ ] 7.2 Playtest: verify boss encounter, weapon patterns, evolution, difficulty curve
- [x] 7.3 Commit and push
