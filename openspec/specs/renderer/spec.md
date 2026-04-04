# renderer Specification

## Purpose
Defines all rendering responsibilities: camera, map, entities, HUD, UI overlays, and visual effects.
## Requirements
### Requirement: Camera follow
The renderer SHALL use a camera that smoothly follows the player using lerp interpolation.

#### Scenario: Camera tracks player
- **WHEN** the player moves
- **THEN** the camera smoothly pans to keep the player centered on screen

### Requirement: Map rendering
The renderer SHALL draw the map background with a subtle grid and visible boundary walls.

#### Scenario: Grid and border
- **WHEN** the game is rendering
- **THEN** a grid pattern is visible on the map floor and red borders mark the map edges

### Requirement: Entity rendering
The renderer SHALL draw all game entities (player, enemies, projectiles, pickups) as colored circles with appropriate visual indicators.

#### Scenario: Player rendering
- **WHEN** the player is rendered
- **THEN** it appears as a colored circle; during invincibility it flashes/blinks

#### Scenario: Enemy rendering
- **WHEN** enemies are rendered
- **THEN** each appears as a colored circle per its type definition, with an HP bar if damaged

#### Scenario: Projectile rendering
- **WHEN** projectiles are rendered
- **THEN** they appear as small colored circles matching their weapon color

#### Scenario: EXP gem rendering
- **WHEN** EXP gems are rendered
- **THEN** they appear as small glowing diamond shapes

### Requirement: HUD display
The renderer SHALL draw a heads-up display with player HP bar, EXP bar, level number, and survival timer.

#### Scenario: HP bar
- **WHEN** the HUD is rendered
- **THEN** an HP bar shows current/max HP at the top of the screen

#### Scenario: EXP bar
- **WHEN** the HUD is rendered
- **THEN** a thin EXP bar below the HP bar shows progress to next level

#### Scenario: Timer and level
- **WHEN** the HUD is rendered
- **THEN** elapsed time (MM:SS) and current level are displayed

### Requirement: Virtual joystick rendering
On touch devices, the renderer SHALL draw the virtual joystick base and knob when active.

#### Scenario: Joystick active
- **WHEN** the player touches the screen and drags
- **THEN** a translucent joystick base and knob are drawn at the touch position

### Requirement: Level-up panel
During 'levelup' state, the renderer SHALL display skill choice buttons.

#### Scenario: Skill choices display
- **WHEN** the game is in 'levelup' state
- **THEN** choiceCount skill options are displayed as tappable buttons with icon, name, and description

### Requirement: Game-over overlay
During 'gameover' state, the renderer SHALL display final stats and a restart prompt.

#### Scenario: Game over screen
- **WHEN** the game is in 'gameover' state
- **THEN** a semi-transparent overlay shows "遊戲結束", survival time, kills, level, and "點擊重新開始"

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

