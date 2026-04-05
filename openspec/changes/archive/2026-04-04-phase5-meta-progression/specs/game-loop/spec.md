## MODIFIED Requirements

### Requirement: Game state machine
The game state machine SHALL support: `menu`, `settings`, `shop`, `characters`, `playing`, `levelup`, `gameover`.

#### Scenario: Navigate to shop
- **WHEN** the player taps "商店" on the main menu
- **THEN** the game state SHALL change to `shop`

#### Scenario: Navigate to character select
- **WHEN** the player taps "角色" on the main menu
- **THEN** the game state SHALL change to `characters`

#### Scenario: Return from shop/characters
- **WHEN** the player taps "返回" on shop or character select
- **THEN** the game state SHALL change to `menu`

## ADDED Requirements

### Requirement: Gold tracking during run
The system SHALL track gold earned during each run. When an enemy dies, gold SHALL be added based on `CONFIG.meta.goldPerKill` multiplied by the player's gold rate bonus.

#### Scenario: Gold earned on kill
- **WHEN** an enemy is killed
- **THEN** `goldPerKill * goldRateMultiplier` gold SHALL be added to the run total

### Requirement: Gold saved on game over
The system SHALL add the run's gold to the persistent total when the game ends.

#### Scenario: Run gold persisted
- **WHEN** the game over state is triggered
- **THEN** run gold SHALL be added to persistent gold and saved to localStorage
