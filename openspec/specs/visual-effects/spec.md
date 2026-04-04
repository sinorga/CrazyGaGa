# visual-effects Specification

## Purpose
Defines all visual effect systems: floating damage numbers, screen transitions, level-up celebration, and boss entrance sequence.

## Requirements

### Requirement: Floating damage numbers
The system SHALL show damage values as floating text when any entity takes damage.

#### Scenario: Enemy takes damage
- **WHEN** an enemy takes damage
- **THEN** a white floating number appears at the hit position, drifting upward ~40px over 0.8s and fading out

#### Scenario: Player takes damage
- **WHEN** the player takes damage
- **THEN** a red floating number appears, drifting upward and fading out

#### Scenario: Large hit highlight
- **WHEN** damage dealt is ≥50
- **THEN** the floating number is yellow

#### Scenario: Font scaling
- **WHEN** rendering a damage number
- **THEN** font size is `min(20, 12 + floor(damage / 10))` px with slight random horizontal drift (±15px)

#### Scenario: Particle cap
- **WHEN** there are already 30 active damage text particles
- **THEN** the oldest particle is removed before adding a new one

### Requirement: Screen transitions
The system SHALL fade the screen to black when transitioning between major states.

#### Scenario: Menu to playing
- **WHEN** transitioning from menu to playing
- **THEN** the screen fades to black over 0.3s then fades in after the state change

#### Scenario: Transition to game over
- **WHEN** transitioning to gameover or victory state
- **THEN** the screen fades to black over 0.3s then fades in

### Requirement: Level-up celebration
The system SHALL emit a particle burst and flash the screen when the player levels up.

#### Scenario: Level-up particles
- **WHEN** the player levels up
- **THEN** 20 golden particles burst upward from the player position

#### Scenario: Gold flash
- **WHEN** the player levels up
- **THEN** the screen briefly flashes a gold tint overlay for 0.15s

### Requirement: Boss entrance sequence
The system SHALL display a 2-second cinematic sequence when a boss spawns.

#### Scenario: Warning phase (0–1s)
- **WHEN** a boss spawns and entrance timer is between 1–2s remaining
- **THEN** the screen darkens and "⚠ WARNING ⚠" text pulses red

#### Scenario: Reveal phase (1–2s)
- **WHEN** entrance timer is between 0–1s remaining
- **THEN** the boss name fades in and the darkening fades out

#### Scenario: Game continues during entrance
- **WHEN** the boss entrance sequence plays
- **THEN** enemies still move and game logic continues normally
