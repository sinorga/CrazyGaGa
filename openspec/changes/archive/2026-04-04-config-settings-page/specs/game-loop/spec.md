## MODIFIED Requirements

### Requirement: Game state machine
The game state machine SHALL support the states: `menu`, `settings`, `playing`, `levelup`, `gameover`. The `settings` state SHALL be reachable from `menu` and SHALL return to `menu`.

#### Scenario: Navigate to settings
- **WHEN** the player taps "設定" on the main menu
- **THEN** the game state SHALL change to `settings`

#### Scenario: Return from settings
- **WHEN** the player taps "返回" on the settings page
- **THEN** the game state SHALL change to `menu`

#### Scenario: Start game from menu
- **WHEN** the game is in `settings` state
- **THEN** tapping outside the back/reset/slider areas SHALL NOT start the game
