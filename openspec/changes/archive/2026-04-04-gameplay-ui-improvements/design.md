## Overview

Four targeted gameplay and UI improvements: pause menu, skill UI overhaul, skill max level cap, and magic orb enhancements.

## Design Decisions

### 1. Pause Menu
- New game state `'paused'` added to state machine
- Small pause button (⏸) rendered top-right corner during gameplay
- Clicking pause button transitions to `'paused'` state, halts `updatePlaying()`
- Pause overlay: semi-transparent background, two buttons: "繼續遊戲" (resume) and "離開遊戲" (exit to menu)
- Resume returns to `'playing'`, exit returns to `'menu'` (no gold saved since run abandoned)

### 2. Skill Level Display & Selection Layout
- **HUD skill display**: Show acquired skills as a row of icons with level numbers at the top-left below the level indicator. Compact: icon + "Lv.N" per skill, max ~6 visible.
- **Horizontal level-up panel**: Skill choices rendered as horizontal cards side-by-side instead of vertical stack. Positioned at top 40% of screen (above joystick zone). Each card shows icon, name, description. Card width adjusts to fit 3 cards with gaps.

### 3. Skill Max Level
- Change weapon skill `maxLevel` from 8 to 5 in `src/data/skills.js`
- `getRandomSkillChoices()` already filters maxed skills — no logic change needed
- Passive skills keep their existing maxLevel values (3-5)

### 4. Magic Orb Enhancements
- **Count scaling**: Change from `+1 every 3 levels` to `+1 every level` in `_updateOrbit()`. Formula: `cfg.count + (weapon.level - 1)` instead of `cfg.count + Math.floor((weapon.level - 1) / 3)`
- **Enemy projectile destruction**: In `_processCollisions()`, add orb-vs-enemyProjectile check. When an orb overlaps an enemy projectile, destroy the projectile and emit a small particle effect. Orbs are not consumed.

## Data Flow

```
Pause button tap → game.state = 'paused' → updatePlaying skipped → draw pause overlay
Resume tap → game.state = 'playing'
Exit tap → game.state = 'menu'

Level up → horizontal panel at y=20% → skill selected → game resumes
Magic orb update → count = base + (level-1) → orbit positions calculated
Collision check → orb circles vs enemyProjectile circles → destroy on overlap
```

## Risk Assessment

- Horizontal skill layout may be tight on very narrow screens — cards will auto-scale width based on canvas width
- Orb-projectile destruction is cheap since orb count is small (max ~6) and enemy projectiles are already iterated in collision loop
