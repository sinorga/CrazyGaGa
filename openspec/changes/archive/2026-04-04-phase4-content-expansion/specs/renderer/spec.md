## MODIFIED Requirements

### Requirement: Boss HP bar UI
The renderer SHALL display a prominent boss HP bar when a boss is active.

#### Scenario: Boss HP bar display
- **WHEN** a boss enemy is alive
- **THEN** a wide HP bar with boss name is rendered at the top center of the screen, below the player HUD

### Requirement: Screen shake effect
The renderer SHALL apply screen shake by adding decaying random offset to the camera.

#### Scenario: Shake on boss hit
- **WHEN** the player takes damage from a boss attack
- **THEN** the camera shakes with configurable intensity that decays to zero

#### Scenario: Shake on player damage
- **WHEN** the player takes any damage
- **THEN** a mild camera shake occurs

### Requirement: Damage flash
The renderer SHALL flash the screen red briefly when the player takes damage.

#### Scenario: Red flash
- **WHEN** the player takes damage
- **THEN** a semi-transparent red overlay flashes on screen for ~0.1 seconds
