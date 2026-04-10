import { describe, it, expect } from 'vitest';
import { UPGRADE_DEFINITIONS, getUpgradeDefinition } from '../src/data/upgrades.js';
import { CHARACTER_DEFINITIONS, getCharacterDefinition } from '../src/data/characters.js';

describe('Upgrade Definitions', () => {
  it('has exactly 6 upgrades', () => {
    expect(UPGRADE_DEFINITIONS.length).toBe(6);
  });

  it('each upgrade has valid structure', () => {
    for (const u of UPGRADE_DEFINITIONS) {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.stat).toBeTruthy();
      expect(u.maxLevel).toBeGreaterThan(0);
      expect(u.costs.length).toBe(u.maxLevel);
      expect(u.values.length).toBe(u.maxLevel);
      expect(['flat', 'percent']).toContain(u.type);
    }
  });

  it('costs are all positive', () => {
    for (const u of UPGRADE_DEFINITIONS) {
      for (const cost of u.costs) {
        expect(cost).toBeGreaterThan(0);
      }
    }
  });

  it('getUpgradeDefinition returns correct upgrade', () => {
    expect(getUpgradeDefinition('hp_boost').name).toBe('生命強化');
    expect(getUpgradeDefinition('nonexistent')).toBeNull();
  });
});

describe('Character Definitions', () => {
  it('has exactly 3 characters', () => {
    expect(CHARACTER_DEFINITIONS.length).toBe(3);
  });

  it('each character has valid structure', () => {
    for (const c of CHARACTER_DEFINITIONS) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.startingWeapon).toBeTruthy();
      expect(c.color).toBeTruthy();
      expect(c.baseStats).toBeDefined();
      expect(typeof c.unlockCost).toBe('number');
    }
  });

  it('has exactly one free starter character', () => {
    const free = CHARACTER_DEFINITIONS.filter(c => c.unlockCost === 0);
    expect(free.length).toBe(1);
    expect(free[0].id).toBe('warrior');
  });

  it('each character has a different starting weapon', () => {
    const weapons = CHARACTER_DEFINITIONS.map(c => c.startingWeapon);
    expect(new Set(weapons).size).toBe(3);
  });

  it('getCharacterDefinition returns correct character', () => {
    expect(getCharacterDefinition('mage').name).toBe('法師');
    expect(getCharacterDefinition('nonexistent')).toBeNull();
  });
});
