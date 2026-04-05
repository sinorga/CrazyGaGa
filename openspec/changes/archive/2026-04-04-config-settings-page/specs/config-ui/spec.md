## ADDED Requirements

### Requirement: Settings definitions array
The system SHALL define an array of setting definitions, each with: key, label (繁體中文), CONFIG path, min, max, step, and default value. This array drives both the UI rendering and the persistence logic.

#### Scenario: All 8 settings defined
- **WHEN** the settings definitions are loaded
- **THEN** there SHALL be exactly 8 entries: 玩家血量, 移動速度, 攻速倍率, 刷怪間隔, 最大敵人數, Boss擊殺門檻, 敵人血量增長, 敵人傷害增長

### Requirement: Settings persistence in localStorage
The system SHALL save user-modified settings to localStorage under the key `crazygaga_settings` as a JSON object mapping setting keys to numeric values.

#### Scenario: Save settings
- **WHEN** the player modifies a slider value
- **THEN** the system SHALL persist all current settings to localStorage immediately

#### Scenario: Load settings on page load
- **WHEN** the page loads and localStorage contains `crazygaga_settings`
- **THEN** the system SHALL read the saved values and apply them to CONFIG before game instantiation

#### Scenario: localStorage unavailable
- **WHEN** localStorage is unavailable or the stored data is corrupt
- **THEN** the system SHALL silently fall back to default CONFIG values

### Requirement: Apply settings to CONFIG
The system SHALL provide an `applyUserSettings()` function that reads saved settings and overwrites the corresponding CONFIG fields. The cooldown multiplier setting SHALL be stored and applied to all weapon cooldowns at game start.

#### Scenario: Apply HP setting
- **WHEN** saved settings contain `playerMaxHp: 1000`
- **THEN** `CONFIG.player.maxHp` SHALL be set to 1000

#### Scenario: Apply cooldown multiplier
- **WHEN** saved settings contain `cooldownMultiplier: 0.5`
- **THEN** all weapon base cooldowns SHALL be multiplied by 0.5 when the game starts

### Requirement: Reset to defaults
The system SHALL provide a reset function that clears saved settings from localStorage and restores all CONFIG values to their original defaults.

#### Scenario: Reset settings
- **WHEN** the player taps the "重置預設" button
- **THEN** all settings SHALL revert to defaults and localStorage SHALL be cleared

### Requirement: Slider interaction
Each setting SHALL be adjustable via a horizontal slider. The slider SHALL support both touch drag and mouse drag. The value SHALL update in real-time as the slider is dragged.

#### Scenario: Drag slider on mobile
- **WHEN** the player touches and drags a slider track
- **THEN** the setting value SHALL update continuously to reflect the slider position

#### Scenario: Value clamping
- **WHEN** a slider is dragged beyond its min or max
- **THEN** the value SHALL be clamped to the defined range
