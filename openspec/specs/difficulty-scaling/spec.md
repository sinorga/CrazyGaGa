# difficulty-scaling Specification

## Purpose
Defines time-based enemy stat scaling to increase challenge over the course of a run.

## Requirements

### Requirement: Time-based enemy stat scaling
Enemy HP and damage SHALL increase over time based on configurable multipliers.

#### Scenario: Early game baseline
- **WHEN** the game starts
- **THEN** enemies spawn with their base stats (multiplier = 1.0)

#### Scenario: Late game scaling
- **WHEN** 10 minutes have elapsed and hpMultiplierPerMinute is 0.1
- **THEN** newly spawned enemies have 2.0x HP (1 + 10 * 0.1)

#### Scenario: Existing enemies unaffected
- **WHEN** difficulty increases
- **THEN** already-spawned enemies retain their original stats
