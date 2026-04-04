## ADDED Requirements

### Requirement: Character definitions
The system SHALL define 3 characters in `src/data/characters.js`: 戰士 (free), 法師 (500 gold), 聖騎士 (1000 gold). Each character SHALL have: id, name, description, startingWeapon, color, baseStats, unlockCost.

#### Scenario: All characters defined
- **WHEN** character definitions are loaded
- **THEN** there SHALL be exactly 3 characters with distinct starting weapons

### Requirement: Character unlock
The system SHALL allow unlocking characters by spending gold. Unlock state SHALL persist in localStorage.

#### Scenario: Unlock character
- **WHEN** the player taps a locked character with sufficient gold
- **THEN** the character SHALL be unlocked AND gold SHALL decrease by the unlock cost

#### Scenario: Free starter character
- **WHEN** the game loads for the first time
- **THEN** the 戰士 character SHALL be unlocked by default

### Requirement: Character selection
The system SHALL allow selecting any unlocked character. The selected character SHALL be used for the next run.

#### Scenario: Select character
- **WHEN** the player taps an unlocked character
- **THEN** that character SHALL become the selected character for the next run

### Requirement: Apply character stats
The system SHALL apply the selected character's base stats and starting weapon when a run begins.

#### Scenario: Mage selected
- **WHEN** the player starts a run with 法師 selected
- **THEN** the starting weapon SHALL be magic_orb AND maxHp SHALL be 350
