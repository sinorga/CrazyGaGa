# meta-shop Specification

## Purpose
Defines the persistent meta-progression shop: upgrade definitions, gold persistence, purchase logic, and stat application at run start.

## Requirements

### Requirement: Upgrade definitions
The system SHALL define 6 permanent upgrades in `src/data/upgrades.js`, each with: id, name (繁體中文), description, stat, maxLevel, costs array, and values array.

#### Scenario: All upgrades defined
- **WHEN** upgrade definitions are loaded
- **THEN** there SHALL be exactly 6 upgrades: 生命強化, 攻擊強化, 速度強化, 護甲強化, 金幣加成, 經驗加成

### Requirement: Gold persistence
The system SHALL persist total gold in localStorage under `crazygaga_meta`. Gold SHALL accumulate across runs.

#### Scenario: Gold saved after run
- **WHEN** a run ends (game over)
- **THEN** the gold earned during the run SHALL be added to the persistent total

#### Scenario: Gold loaded on page load
- **WHEN** the page loads with existing meta data
- **THEN** the stored gold total SHALL be available for spending in the shop

#### Scenario: localStorage unavailable
- **WHEN** localStorage is unavailable
- **THEN** the system SHALL use 0 gold and empty upgrades without error

### Requirement: Purchase upgrades
The system SHALL allow purchasing upgrades when the player has sufficient gold. Each purchase SHALL deduct the cost, increment the upgrade level, and persist immediately.

#### Scenario: Successful purchase
- **WHEN** the player taps an upgrade with sufficient gold
- **THEN** the gold SHALL decrease by the cost AND the upgrade level SHALL increase by 1

#### Scenario: Insufficient gold
- **WHEN** the player taps an upgrade without sufficient gold
- **THEN** nothing SHALL happen (no purchase, no gold change)

#### Scenario: Max level reached
- **WHEN** an upgrade is at max level
- **THEN** the upgrade SHALL display as maxed and not be purchasable

### Requirement: Apply upgrades at game start
The system SHALL apply all purchased permanent upgrades to the player's base stats when a new run begins.

#### Scenario: HP upgrade applied
- **WHEN** the player has 生命強化 at level 3 (+150 HP)
- **THEN** the player's starting maxHp SHALL be increased by 150
