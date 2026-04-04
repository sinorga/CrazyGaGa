## MODIFIED Requirements

### Requirement: Summoner enemy behavior
Summoner enemies SHALL spawn minion enemies on a timer while maintaining distance from the player.

#### Scenario: Summon minions
- **WHEN** the summoner's summon timer expires
- **THEN** it spawns summonCount enemies of summonId type near its position and resets the timer

#### Scenario: Keep distance
- **WHEN** a summoner is closer than preferredDistance to the player
- **THEN** it moves away from the player
