# Renderer Changes (Delta)

## Modified: drawPlayer / drawEnemies
- MUST apply idle pulse: radius oscillates ±1px using `sin(elapsed * 3)`
- MUST draw white fill instead of normal color when `entity.hitFlashTimer > 0`

## Modified: drawPickups
- MUST pulse gem radius using `sin(elapsed * 5) * 2` for glow effect
- MUST render brighter glow ring that pulses with the gem

## New: drawBossEntrance
- MUST render darkened overlay + warning text during boss entrance phase
- MUST render boss name during second phase

## New: drawTransition
- MUST render black overlay with alpha for screen transitions
- Called every frame; alpha interpolated by transition system

## New: triggerLevelUpFlash
- MUST flash gold tint overlay for 0.15s on level up
