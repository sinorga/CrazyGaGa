## ADDED Requirements

### Requirement: Wave spawner
The game SHALL spawn enemies in waves based on elapsed time. Spawn interval decreases over time per CONFIG.waves settings. Enemy types unlock based on their unlockTime.

#### Scenario: Initial spawn
- **WHEN** the game starts playing
- **THEN** after CONFIG.waves.initialDelay seconds, the first wave of enemies spawns

#### Scenario: Escalating difficulty
- **WHEN** time progresses
- **THEN** spawn interval decreases (multiplied by spawnIntervalDecay) and enemies per wave increases

#### Scenario: Enemy type unlocking
- **WHEN** elapsed time exceeds an enemy type's unlockTime
- **THEN** that enemy type enters the spawn pool with its configured weight

#### Scenario: Max enemy cap
- **WHEN** the number of active enemies reaches CONFIG.waves.maxEnemies
- **THEN** no more enemies spawn until some are killed

### Requirement: Charger enemy behavior
Charger enemies SHALL move directly toward the player at their configured speed.

#### Scenario: Chase player
- **WHEN** a charger enemy is active
- **THEN** it moves in a straight line toward the player's current position

### Requirement: Shooter enemy behavior
Shooter enemies SHALL maintain preferred distance and fire projectiles at the player.

#### Scenario: Keep distance
- **WHEN** a shooter is closer than preferredDistance to the player
- **THEN** it moves away from the player

#### Scenario: Fire projectile
- **WHEN** the shooter's fire cooldown expires
- **THEN** it fires a projectile toward the player at configured speed and damage

### Requirement: Tank enemy behavior
Tank enemies SHALL move toward the player slowly with high HP.

#### Scenario: Slow chase
- **WHEN** a tank enemy is active
- **THEN** it moves toward the player at its (slow) configured speed

### Requirement: Exploder enemy behavior
Exploder enemies SHALL explode on death dealing area damage.

#### Scenario: Death explosion
- **WHEN** an exploder enemy's HP reaches 0
- **THEN** it creates an explosion at its position dealing explosionDamage in explosionRadius

### Requirement: Enemy-player collision damage
Active enemies SHALL damage the player on contact.

#### Scenario: Contact damage
- **WHEN** an enemy's collision circle overlaps the player's collision circle
- **THEN** the player takes the enemy's configured contact damage (subject to invincibility)
