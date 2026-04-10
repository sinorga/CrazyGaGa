# player-entity Specification

## Purpose
Defines player movement, health, and stat system including passive skill effects and HP regeneration.
## Requirements
### Requirement: Player movement
The Player SHALL move in the direction indicated by Input at speed defined in CONFIG.player.speed, modified by passive speed bonuses. Movement SHALL be clamped to map boundaries.

#### Scenario: Move with keyboard
- **WHEN** WASD or arrow keys are pressed
- **THEN** the player moves in the corresponding direction at configured speed

#### Scenario: Move with virtual joystick
- **WHEN** the touch joystick is active with a direction vector
- **THEN** the player moves in that direction, speed scaled by joystick displacement

#### Scenario: Map boundary clamping
- **WHEN** the player reaches the edge of the map
- **THEN** position is clamped so the player cannot exit the map area

### Requirement: Player health
The Player SHALL have HP starting at CONFIG.player.maxHp (modified by passives). HP SHALL decrease when damaged and the player dies when HP reaches 0.

#### Scenario: Take damage
- **WHEN** an enemy or enemy projectile contacts the player
- **THEN** player HP decreases by (enemy damage - player armor), minimum 1 damage

#### Scenario: Invincibility after hit
- **WHEN** the player takes damage
- **THEN** the player becomes invincible for CONFIG.player.invincibleDuration seconds

#### Scenario: Death
- **WHEN** player HP reaches 0
- **THEN** game state transitions to 'gameover'

### Requirement: Player stats
The Player SHALL track modified stats from passive skills: maxHp, speed, damage multiplier, cooldown multiplier, armor, regen, pickupRange, expBonus.

#### Scenario: Apply passive skill
- **WHEN** a passive skill is selected during level-up
- **THEN** the corresponding stat is modified (flat add or percent multiply) and takes effect immediately

#### Scenario: HP regeneration
- **WHEN** the player has regen > 0
- **THEN** HP increases by regen amount per second, capped at maxHp

