## ADDED Requirements

### Requirement: Fixed timestep game loop
The Game class SHALL run a game loop using requestAnimationFrame with a fixed logic timestep of 1/60 second. Rendering SHALL happen every frame. Logic updates SHALL use an accumulator to decouple from frame rate.

#### Scenario: Stable updates at varying frame rates
- **WHEN** the browser runs at 30 FPS or 120 FPS
- **THEN** game logic updates occur at a consistent rate of 60 updates per second

#### Scenario: Game loop starts and stops
- **WHEN** the game is initialized and `start()` is called
- **THEN** the loop begins running and updates entities each tick
- **WHEN** the game state transitions to 'gameover'
- **THEN** the loop continues running (for UI rendering) but entity updates stop

### Requirement: Game state machine
The Game SHALL manage states: 'menu', 'playing', 'levelup', 'gameover'. State transitions SHALL be explicit.

#### Scenario: Initial state
- **WHEN** the game is first loaded
- **THEN** the state SHALL be 'menu'

#### Scenario: Start game
- **WHEN** the player triggers start (tap or any key) from 'menu' state
- **THEN** the state transitions to 'playing' and entities are initialized

#### Scenario: Level up pauses action
- **WHEN** the player gains enough EXP to level up during 'playing'
- **THEN** the state transitions to 'levelup', enemies and projectiles freeze

#### Scenario: Skill selected resumes play
- **WHEN** the player selects a skill during 'levelup'
- **THEN** the state transitions back to 'playing'

#### Scenario: Player death
- **WHEN** the player's HP reaches 0 during 'playing'
- **THEN** the state transitions to 'gameover' showing elapsed time and kill count

#### Scenario: Restart
- **WHEN** the player triggers restart from 'gameover'
- **THEN** all state resets and transitions to 'playing'

### Requirement: HTML entry point
The index.html SHALL create a full-viewport Canvas element, import the Game module, and initialize the game.

#### Scenario: Page load
- **WHEN** index.html is loaded in a browser
- **THEN** a Canvas fills the viewport, the game initializes, and the menu state is shown

#### Scenario: Responsive resize
- **WHEN** the browser window is resized
- **THEN** the Canvas resizes to fill the new viewport dimensions
