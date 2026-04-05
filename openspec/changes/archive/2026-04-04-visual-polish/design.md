## Overview

Six visual polish features layered onto the existing particle system and renderer. All effects are lightweight canvas operations — no new dependencies.

## Design Decisions

### 1. Floating Damage Numbers
- Extend `ParticleSystem` with a `emitText(x, y, text, color, opts)` method
- Text particles float upward, fade out over ~0.8s, with slight random X drift
- Stored in separate `textParticles` array to avoid interfering with regular particles
- Color coding: white for normal damage, yellow for crits/boss, red for player damage taken
- Font size scales with damage magnitude: `Math.min(20, 12 + Math.floor(damage / 10))` px

### 2. Screen Transitions
- New `Transition` class in renderer with `fadeIn()` / `fadeOut()` methods
- Uses a simple alpha overlay (black) that interpolates over 0.3s
- Game state changes trigger: `fadeOut → change state → fadeIn`
- Only applied to major transitions: menu→playing, playing→gameover/victory
- Stored as `renderer.transition = { active, alpha, direction, callback }`

### 3. Sprite Animations
- **Idle pulse**: All entities gently oscillate radius by ±1px using `sin(elapsed * 3)` — applied in drawPlayer/drawEnemies
- **Hit flash**: When an entity takes damage, set `entity.hitFlashTimer = 0.1`. Renderer draws white fill instead of normal color while timer > 0
- **Death shrink**: Already handled by enemy removal; no change needed (particles suffice)

### 4. XP Gem Sparkle
- In `drawPickups()`, add a glow pulse: radius oscillates using `sin(elapsed * 5) * 2`
- Every ~0.5s, emit 1-2 tiny sparkle particles from gem position (handled in game update, not renderer)
- Sparkle particles: small, white/cyan, short lifetime (0.3s)

### 5. Level-Up Celebration
- When `triggerLevelUp()` fires, call `particles.emit()` with golden config: 20 particles, upward bias, gold color, larger size
- Also trigger a brief screen flash (gold tint, 0.15s) via renderer

### 6. Boss Entrance
- When boss spawns, set `game.bossEntrance = { timer: 2.0, phase: 'warning' }`
- Phase 1 (0-1s): Screen darkens, "⚠ WARNING ⚠" text pulses red
- Phase 2 (1-2s): Boss name appears, darkening fades
- During entrance, game continues but spawning paused (already paused during boss)
- Renderer draws the overlay; game.js decrements timer

## Data Flow

```
Enemy.takeDamage → particles.emitText(x, y, dmgAmount, color)
Player.takeDamage → particles.emitText(x, y, dmgAmount, '#ff4444')
State change → renderer.startTransition('out', callback) → callback changes state → renderer.startTransition('in')
triggerLevelUp → particles.emit(golden burst) + renderer.triggerLevelUpFlash()
Boss spawn → game.bossEntrance = {timer, phase} → renderer.drawBossEntrance()
```

## Performance Notes
- Text particles capped at 30 simultaneous (damage numbers)
- Transition overlay is a single fillRect — negligible cost
- Pulse animations use elapsed time, no extra state needed
