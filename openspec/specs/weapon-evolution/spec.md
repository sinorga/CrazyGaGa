# weapon-evolution Specification

## Purpose
Defines the weapon evolution system: recipes for combining max-level weapons with passives to unlock evolved forms.

## Requirements

### Requirement: Evolution recipe definitions
A data file SHALL define weapon evolution recipes. Each recipe specifies a weapon at max level + a required passive = an evolved weapon.

#### Scenario: Recipe data structure
- **WHEN** the evolution data file is loaded
- **THEN** each recipe has weaponId, requiredPassiveId, and evolvedWeaponId fields

### Requirement: Evolution eligibility check
The game SHALL check if a weapon qualifies for evolution when the player levels up.

#### Scenario: Eligible for evolution
- **WHEN** the player has a weapon at max level AND has the required passive
- **THEN** the evolution option appears as a special choice during level-up

#### Scenario: Not eligible
- **WHEN** the weapon is not at max level OR the required passive is missing
- **THEN** the evolution option does not appear

### Requirement: Evolution application
Selecting an evolution SHALL replace the base weapon with the evolved form.

#### Scenario: Evolve weapon
- **WHEN** the player selects an evolution during level-up
- **THEN** the base weapon is replaced by the evolved weapon with enhanced stats and effects
