## ADDED Requirements

### Requirement: Boss spawn timer
The game SHALL spawn a boss every CONFIG.waves.bossInterval seconds. While a boss is alive, regular wave spawning SHALL pause.

#### Scenario: First boss spawn
- **WHEN** elapsed time reaches bossInterval (180 seconds)
- **THEN** a boss of phase 1 spawns at spawn distance from the player and regular waves pause

#### Scenario: Boss cleared
- **WHEN** the boss is killed
- **THEN** regular wave spawning resumes and boss phase increments

#### Scenario: Next boss is stronger
- **WHEN** the second bossInterval is reached
- **THEN** the phase 2 boss spawns with higher stats and different attack patterns

### Requirement: Boss charge attack
The boss SHALL perform a charge attack — dashing toward the player at high speed for a fixed duration.

#### Scenario: Charge execution
- **WHEN** the boss's charge cooldown expires
- **THEN** the boss dashes toward the player's current position at the configured charge speed for charge duration seconds

### Requirement: Boss bullet ring attack
The boss SHALL fire a ring of projectiles outward in evenly spaced directions.

#### Scenario: Bullet ring execution
- **WHEN** the boss's bullet_ring cooldown expires
- **THEN** the boss creates `count` projectiles radiating outward in equal angles at configured speed

### Requirement: Boss bullet spiral attack
The boss SHALL fire projectiles in a rotating spiral pattern.

#### Scenario: Spiral execution
- **WHEN** the boss's bullet_spiral cooldown expires
- **THEN** the boss fires `count` projectiles in a spiral pattern over time at configured speed

### Requirement: Boss teleport
The boss SHALL teleport to a random position near the player.

#### Scenario: Teleport execution
- **WHEN** the boss's teleport cooldown expires
- **THEN** the boss instantly moves to a random position within spawn distance of the player

### Requirement: Boss summon attack
The boss SHALL summon minion enemies during combat.

#### Scenario: Summon execution
- **WHEN** the boss's summon cooldown expires
- **THEN** `count` enemies of the specified summonId type spawn near the boss position

### Requirement: Boss HP bar UI
The renderer SHALL display a large HP bar at the top of the screen when a boss is alive.

#### Scenario: Boss HP display
- **WHEN** a boss is active on screen
- **THEN** a wide HP bar with the boss name is displayed at the top of the viewport
