## Why

The game uses basic circles and minimal visual feedback. Adding floating damage numbers, sprite animations, screen transitions, and dramatic effects will make combat feel impactful and the game more polished — critical for player engagement in a horde survival game.

## What Changes

- **Floating damage numbers**: Show damage values rising from enemies/player when hit, color-coded by damage type
- **Screen transitions**: Fade in/out when switching between game states (menu→playing, playing→gameover/victory)
- **Sprite animations**: Idle pulse effect for player/enemies, white flash on hit, size scaling on death
- **XP gem sparkle**: Gems emit small sparkle particles and glow pulse while on ground
- **Level-up celebration**: Golden particle burst when player levels up
- **Boss entrance**: Screen darkens briefly, "WARNING" text flashes, dramatic zoom effect before boss spawns

## Capabilities

### New Capabilities
- `visual-effects`: Damage numbers, screen transitions, celebration effects, boss entrance drama

### Modified Capabilities
- `renderer`: Hit flash on sprites, idle pulse animation, gem sparkle rendering, boss entrance overlay

## Impact

- `src/renderer.js`: Hit flash, pulse animations, gem sparkle, boss warning overlay, screen transitions
- `src/particles.js`: Extended with text particle support for damage numbers
- `src/game.js`: Emit damage numbers on hit, trigger level-up burst, trigger boss entrance sequence
- `index.html`: Screen transition rendering in game loop
