# Visual Effects

## Floating Damage Numbers
- MUST show damage value as floating text when any entity takes damage
- Text floats upward ~40px over 0.8s, fading to transparent
- Color: white for enemy damage, red for player damage, yellow for large hits (≥50)
- Font size: `min(20, 12 + floor(damage / 10))` px
- Slight random horizontal drift (±15px)
- Max 30 text particles at once

## Screen Transitions
- MUST fade screen to black (0.3s) when transitioning from menu→playing
- MUST fade screen to black (0.3s) when transitioning to gameover/victory
- MUST fade in (0.3s) after state change completes
- Transition uses black overlay with interpolated alpha

## Level-Up Celebration
- MUST emit 20 golden particles in upward burst when player levels up
- MUST briefly flash screen gold tint (0.15s)

## Boss Entrance
- MUST show 2-second entrance sequence when boss spawns
- Phase 1 (0-1s): Screen darkens, "⚠ WARNING ⚠" text pulses red
- Phase 2 (1-2s): Boss name fades in, darkening fades out
- Game continues during entrance (enemies still move)
