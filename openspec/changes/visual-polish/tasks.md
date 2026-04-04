# Tasks: Visual Polish

## Group 1: Floating Damage Numbers
- [ ] 1.1 Add `emitText()` method and `textParticles` array to ParticleSystem, with update/render for text particles
- [ ] 1.2 Emit damage text in game.js when enemies take damage (_processCollisions) and player takes damage

## Group 2: Sprite Animations
- [ ] 2.1 Add idle pulse to drawPlayer and drawEnemies (radius oscillation via sin)
- [ ] 2.2 Add hit flash: set hitFlashTimer on takeDamage, renderer draws white when timer > 0, decrement in update

## Group 3: XP Gem Sparkle
- [ ] 3.1 Add glow pulse to drawPickups (radius + glow ring oscillation)

## Group 4: Level-Up & Boss Effects
- [ ] 4.1 Add golden particle burst + gold screen flash on level-up in triggerLevelUp
- [ ] 4.2 Add boss entrance sequence: bossEntrance state in game.js, warning overlay in renderer

## Group 5: Screen Transitions
- [ ] 5.1 Add transition system to renderer (startTransition, updateTransition, drawTransition)
- [ ] 5.2 Wire transitions in game.js for menu→playing and playing→gameover/victory state changes

## Group 6: Integration
- [ ] 6.1 Run all tests, verify passing
- [ ] 6.2 Commit and push
