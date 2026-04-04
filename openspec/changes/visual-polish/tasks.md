# Tasks: Visual Polish

## Group 1: Floating Damage Numbers
- [x] 1.1 Add `emitText()` method and `textParticles` array to ParticleSystem, with update/render for text particles
- [x] 1.2 Emit damage text in game.js when enemies take damage (_processCollisions) and player takes damage

## Group 2: Sprite Animations
- [x] 2.1 Add idle pulse to drawPlayer and drawEnemies (radius oscillation via sin)
- [x] 2.2 Add hit flash: set hitFlashTimer on takeDamage, renderer draws white when timer > 0, decrement in update

## Group 3: XP Gem Sparkle
- [x] 3.1 Add glow pulse to drawPickups (radius + glow ring oscillation)

## Group 4: Level-Up & Boss Effects
- [x] 4.1 Add golden particle burst + gold screen flash on level-up in triggerLevelUp
- [x] 4.2 Add boss entrance sequence: bossEntrance state in game.js, warning overlay in renderer

## Group 5: Screen Transitions
- [x] 5.1 Add transition system to renderer (startTransition, updateTransition, drawTransition)
- [x] 5.2 Wire transitions in game.js for menu→playing and playing→gameover/victory state changes

## Group 6: Integration
- [x] 6.1 Run all tests, verify passing
- [x] 6.2 Commit and push
