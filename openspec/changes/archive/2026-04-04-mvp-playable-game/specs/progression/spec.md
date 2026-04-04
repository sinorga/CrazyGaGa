## ADDED Requirements

### Requirement: EXP gem drops
Killed enemies SHALL drop EXP gems worth the enemy's configured exp value.

#### Scenario: Enemy death drops gems
- **WHEN** an enemy dies
- **THEN** an EXP gem is created at the enemy's position with value = enemy.exp

### Requirement: Magnetic gem pickup
EXP gems SHALL be attracted toward the player when within magnetRange and collected when within pickupRange.

#### Scenario: Magnetic pull
- **WHEN** a gem is within CONFIG.player.magnetRange (modified by passives) of the player
- **THEN** the gem accelerates toward the player

#### Scenario: Collection
- **WHEN** a gem is within CONFIG.player.pickupRange of the player
- **THEN** the gem is collected and its EXP value (modified by expBonus) is added to the player's total

### Requirement: Level-up trigger
The player SHALL level up when accumulated EXP reaches the threshold for the next level.

#### Scenario: Reach EXP threshold
- **WHEN** the player's total EXP reaches or exceeds the level-up threshold
- **THEN** the game state transitions to 'levelup' and a skill selection panel appears

#### Scenario: Scaling threshold
- **WHEN** calculating the EXP needed for level N
- **THEN** the threshold is baseExpToLevel * (expGrowthFactor ^ (N-1))

### Requirement: Skill selection
During level-up, the player SHALL choose one skill from CONFIG.leveling.choiceCount random options.

#### Scenario: Display choices
- **WHEN** the game enters 'levelup' state
- **THEN** choiceCount random skill options are displayed (excluding maxed skills)

#### Scenario: Select skill
- **WHEN** the player taps/clicks a skill choice
- **THEN** the skill is applied (weapon granted/upgraded or passive stat modified) and play resumes

### Requirement: Kill and time tracking
The game SHALL track total kills and elapsed time for display on game-over.

#### Scenario: Game over stats
- **WHEN** the game enters 'gameover' state
- **THEN** the screen displays survival time, total kills, and level reached
