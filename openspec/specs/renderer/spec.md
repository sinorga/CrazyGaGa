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

### Requirement: Main menu rendering
The renderer SHALL draw the main menu with: title, subtitle, "點擊開始遊戲" prompt, control info, "設定" button, "商店" button, "角色" button, and the selected character name.

#### Scenario: Menu shows all buttons
- **WHEN** the game is in `menu` state
- **THEN** the renderer SHALL display settings, shop, and character buttons

### Requirement: Gold in HUD
The renderer SHALL display the current run gold earned in the HUD during gameplay.

#### Scenario: Gold counter visible during play
- **WHEN** the game is in `playing` state
- **THEN** the HUD SHALL show the gold earned this run

### Requirement: Shop page rendering
The renderer SHALL provide a `drawShopPage()` method showing: title "商店", total gold, upgrade rows (name, level, cost, buy button), and a back button.

#### Scenario: Render shop
- **WHEN** the game is in `shop` state
- **THEN** the renderer SHALL display all 6 upgrades with current levels, costs, and gold total

### Requirement: Character select rendering
The renderer SHALL provide a `drawCharacterSelect()` method showing: title "選擇角色", character cards (name, stats, weapon, lock/select state), and a back button.

#### Scenario: Render character select
- **WHEN** the game is in `characters` state
- **THEN** the renderer SHALL display all 3 characters with their stats and lock/unlock state

### Requirement: Game over gold display
The renderer SHALL show gold earned during the run on the game over screen.

#### Scenario: Gold shown on game over
- **WHEN** the game is in `gameover` state
- **THEN** the game over screen SHALL display the gold earned this run

### Requirement: Entity idle pulse
The renderer SHALL animate entities with a subtle radius oscillation when alive.

#### Scenario: Idle pulse
- **WHEN** rendering a player or enemy
- **THEN** the entity's radius oscillates ±1px using `sin(elapsed * 3)`

### Requirement: Hit flash effect
The renderer SHALL draw entities with a white fill briefly after taking damage.

#### Scenario: Hit flash
- **WHEN** an entity has `hitFlashTimer > 0`
- **THEN** the entity is drawn with a white fill instead of its normal color

### Requirement: EXP gem pulse
The renderer SHALL animate EXP gem pickups with a pulsing glow effect.

#### Scenario: Gem pulse
- **WHEN** rendering EXP gems
- **THEN** gem radius pulses using `sin(elapsed * 5) * 2` with a brighter pulsing glow ring

### Requirement: Boss entrance overlay
The renderer SHALL display a cinematic overlay during the boss entrance sequence.

#### Scenario: Boss entrance phases
- **WHEN** `game.bossEntrance` is active
- **THEN** a darkened overlay and warning text render during phase 1, boss name fades in during phase 2

### Requirement: Screen transition overlay
The renderer SHALL render a black overlay with interpolated alpha for screen transitions.

#### Scenario: Transition overlay
- **WHEN** a transition is active
- **THEN** a black overlay is drawn every frame with alpha interpolated by the transition system

### Requirement: Level-up flash
The renderer SHALL briefly flash a gold tint overlay when the player levels up.

#### Scenario: Gold tint on level up
- **WHEN** the player levels up
- **THEN** a gold tint overlay flashes for 0.15s

