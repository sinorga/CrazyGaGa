## MODIFIED Requirements

### Requirement: Main menu rendering
The renderer SHALL draw the main menu with the game title, subtitle, start prompt, control instructions, AND a "設定" (Settings) button.

#### Scenario: Settings button visible on menu
- **WHEN** the game is in `menu` state
- **THEN** the renderer SHALL display a "設定" button below the start prompt

## ADDED Requirements

### Requirement: Settings page rendering
The renderer SHALL provide a `drawSettingsPage()` method that renders the settings UI. It SHALL display a title "遊戲設定", all 8 slider rows (label, slider track, value), a "重置預設" (Reset) button, and a "返回" (Back) button.

#### Scenario: Render settings page
- **WHEN** the game is in `settings` state
- **THEN** the renderer SHALL draw the settings panel with all sliders, labels, current values, reset button, and back button

#### Scenario: Scrollable if needed
- **WHEN** the settings panel is taller than the screen
- **THEN** the settings page SHALL support vertical scrolling via touch/mouse drag
