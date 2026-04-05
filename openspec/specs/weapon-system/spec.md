# weapon-system Specification

## Purpose
Defines all weapon patterns, behaviors, leveling, and collision for player weapons.
## Requirements
### Requirement: Auto-attack when stationary
The player's weapons SHALL fire automatically when the player is not moving, after a brief delay (CONFIG.combat.autoAttackDelay).

#### Scenario: Stop and shoot
- **WHEN** the player stops moving
- **THEN** after autoAttackDelay seconds, all equipped weapons begin firing at their configured cooldown rate

#### Scenario: Move to stop attacking
- **WHEN** the player starts moving
- **THEN** projectile-type weapons stop firing (orbit/area weapons continue)

### Requirement: Projectile weapon pattern
Projectile weapons SHALL fire bullets toward the nearest enemy. Bullets travel in a straight line and can pierce a configured number of enemies.

#### Scenario: Fire at nearest enemy
- **WHEN** the weapon cooldown expires and the player is stationary
- **THEN** a projectile is created aimed at the nearest enemy

#### Scenario: Projectile pierce
- **WHEN** a projectile hits an enemy and has pierce remaining
- **THEN** it continues through, decrementing pierce count, and can hit the next enemy

#### Scenario: Projectile out of bounds
- **WHEN** a projectile exits the visible screen area (plus margin)
- **THEN** it is removed

### Requirement: Orbit weapon pattern
Orbit weapons SHALL create orbs that rotate around the player, damaging enemies on contact.

#### Scenario: Continuous rotation
- **WHEN** the player has an orbit weapon
- **THEN** orbs rotate around the player at configured orbitSpeed and orbitRadius

#### Scenario: Orbit contact damage
- **WHEN** an orbit orb overlaps an enemy
- **THEN** the enemy takes damage, subject to hitCooldown per enemy

### Requirement: Weapon leveling
Weapons SHALL scale their stats when leveled up via skill selection.

#### Scenario: Level up weapon
- **WHEN** a weapon skill is selected during level-up
- **THEN** the weapon's level increases and stats scale per levelScaling config

#### Scenario: First acquisition
- **WHEN** a weapon skill is selected and the player doesn't have that weapon
- **THEN** the weapon is added to the player's active weapons at level 1

### Requirement: Weapon manager
A WeaponManager SHALL track all active weapons and update them each game tick.

#### Scenario: Multiple weapons
- **WHEN** the player has acquired multiple weapons
- **THEN** all weapons fire independently at their own cooldown rates

### Requirement: Projectile-enemy collision
Player projectiles SHALL damage enemies on collision.

#### Scenario: Hit enemy
- **WHEN** a player projectile overlaps an enemy
- **THEN** the enemy takes damage equal to (weapon damage * player damage multiplier)

#### Scenario: Enemy dies
- **WHEN** an enemy's HP reaches 0 from projectile damage
- **THEN** the enemy is removed and drops EXP gems

### Requirement: Chain lightning weapon pattern
Chain lightning SHALL strike the nearest enemy, then bounce to nearby enemies within chainRange.

#### Scenario: Initial strike
- **WHEN** the chain weapon cooldown expires and the player is stationary
- **THEN** lightning strikes the nearest enemy within range dealing weapon damage

#### Scenario: Chain bounce
- **WHEN** the initial target is hit
- **THEN** lightning bounces to the nearest unhit enemy within chainRange, up to chainCount times

#### Scenario: Visual feedback
- **WHEN** chain lightning fires
- **THEN** a visible line connects all chain targets for config.duration seconds

### Requirement: Area weapon pattern (Holy Sword)
Holy sword rain SHALL drop damaging zones on enemy positions.

#### Scenario: Sword drop
- **WHEN** the area weapon cooldown expires
- **THEN** count damage zones appear near random enemies with randomOffset spread

#### Scenario: Persistent damage
- **WHEN** an enemy stands in a damage zone
- **THEN** it takes damage every tickRate seconds for the zone's duration

### Requirement: Boomerang weapon pattern
The boomerang SHALL travel outward then return to the player, damaging enemies both ways.

#### Scenario: Outbound path
- **WHEN** the boomerang weapon fires
- **THEN** a projectile travels toward the nearest enemy up to maxRange distance

#### Scenario: Return path
- **WHEN** the boomerang reaches maxRange
- **THEN** it reverses direction and returns to the player's current position

#### Scenario: Continuous pierce
- **WHEN** the boomerang contacts enemies on either path
- **THEN** it damages all enemies it passes through (unlimited pierce)

