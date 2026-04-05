## MODIFIED Requirements

### Requirement: Main menu rendering
The renderer SHALL draw the main menu with: title, subtitle, "點擊開始遊戲" prompt, control info, "設定" button, "商店" button, "角色" button, and the selected character name.

#### Scenario: Menu shows all buttons
- **WHEN** the game is in `menu` state
- **THEN** the renderer SHALL display settings, shop, and character buttons

## ADDED Requirements

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
