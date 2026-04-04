## MODIFIED Requirements

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
