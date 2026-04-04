import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  reloadCache, getConfig, getEnemyTypes, getWeaponDefs, getSkillDefs,
  getCharacterDefs, getUpgradeDefs, getEvolutionRecipes,
  setOverride, resetAllOverrides, exportJSON, importJSON,
  getConfigDefaults, getEnemyDefaults, getWeaponDefaults,
  OVERRIDE_KEY,
} from '../src/gameConfig.js';

// ─── localStorage mock ────────────────────────────────────────────────────────

let store = {};
const mockStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', mockStorage);
  resetAllOverrides(); // ensure clean state
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Read defaults ────────────────────────────────────────────────────────────

describe('defaults', () => {
  it('returns enemy types array', () => {
    const enemies = getEnemyTypes();
    expect(Array.isArray(enemies)).toBe(true);
    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies[0]).toHaveProperty('id');
    expect(enemies[0]).toHaveProperty('hp');
  });

  it('returns weapon defs array', () => {
    const weapons = getWeaponDefs();
    expect(Array.isArray(weapons)).toBe(true);
    expect(weapons.length).toBeGreaterThan(0);
  });

  it('returns skill defs array', () => {
    const skills = getSkillDefs();
    expect(Array.isArray(skills)).toBe(true);
  });

  it('returns character defs array', () => {
    const chars = getCharacterDefs();
    expect(Array.isArray(chars)).toBe(true);
    expect(chars.length).toBe(3);
  });

  it('returns upgrade defs array', () => {
    const upg = getUpgradeDefs();
    expect(Array.isArray(upg)).toBe(true);
    expect(upg.length).toBe(6);
  });

  it('returns evolution recipes', () => {
    const ev = getEvolutionRecipes();
    expect(Array.isArray(ev)).toBe(true);
  });
});

// ─── Override merging ─────────────────────────────────────────────────────────

describe('setOverride — enemy fields', () => {
  it('overrides a single enemy field', () => {
    const original = getEnemyTypes().find(e => e.id === 'slime').hp;
    setOverride('enemies', 'slime', 'hp', 999);
    const slime = getEnemyTypes().find(e => e.id === 'slime');
    expect(slime.hp).toBe(999);
    // Other fields unchanged
    expect(slime.speed).toBe(getEnemyDefaults().find(e => e.id === 'slime').speed);
  });

  it('overrides a nested behavior field', () => {
    setOverride('enemies', 'mage', 'behavior.fireRate', 0.5);
    const mage = getEnemyTypes().find(e => e.id === 'mage');
    expect(mage.behavior.fireRate).toBe(0.5);
    // Other behavior fields unchanged
    const def = getEnemyDefaults().find(e => e.id === 'mage');
    expect(mage.behavior.projectileSpeed).toBe(def.behavior.projectileSpeed);
  });

  it('does not affect other enemy types', () => {
    setOverride('enemies', 'slime', 'hp', 999);
    const bat = getEnemyTypes().find(e => e.id === 'fast_bat');
    const defBat = getEnemyDefaults().find(e => e.id === 'fast_bat');
    expect(bat.hp).toBe(defBat.hp);
  });
});

describe('setOverride — config fields', () => {
  it('overrides a nested config path', () => {
    const defMaxHp = getConfigDefaults().player.maxHp;
    setOverride('config', null, 'player.maxHp', 1000);
    expect(getConfig().player.maxHp).toBe(1000);
    // Other player fields unchanged
    expect(getConfig().player.speed).toBe(getConfigDefaults().player.speed);
  });

  it('overrides wave config', () => {
    setOverride('config', null, 'waves.maxEnemies', 200);
    expect(getConfig().waves.maxEnemies).toBe(200);
    expect(getConfig().waves.spawnInterval).toBe(getConfigDefaults().waves.spawnInterval);
  });
});

describe('setOverride — weapon fields', () => {
  it('overrides weapon damage', () => {
    const def = getWeaponDefaults().find(w => w.id === 'arrow');
    setOverride('weapons', 'arrow', 'damage', 50);
    const arrow = getWeaponDefs().find(w => w.id === 'arrow');
    expect(arrow.damage).toBe(50);
    expect(arrow.cooldown).toBe(def.cooldown);
  });

  it('overrides weapon config sub-field', () => {
    setOverride('weapons', 'arrow', 'config.pierce', 5);
    const arrow = getWeaponDefs().find(w => w.id === 'arrow');
    expect(arrow.config.pierce).toBe(5);
  });
});

// ─── Reset ────────────────────────────────────────────────────────────────────

describe('resetAllOverrides', () => {
  it('restores enemy defaults after override', () => {
    const originalHp = getEnemyDefaults().find(e => e.id === 'slime').hp;
    setOverride('enemies', 'slime', 'hp', 999);
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(999);

    resetAllOverrides();
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(originalHp);
  });

  it('restores config defaults', () => {
    const defMaxHp = getConfigDefaults().player.maxHp;
    setOverride('config', null, 'player.maxHp', 1234);
    resetAllOverrides();
    expect(getConfig().player.maxHp).toBe(defMaxHp);
  });

  it('removes localStorage key', () => {
    setOverride('enemies', 'slime', 'hp', 999);
    expect(mockStorage.getItem(OVERRIDE_KEY)).not.toBeNull();
    resetAllOverrides();
    expect(mockStorage.getItem(OVERRIDE_KEY)).toBeNull();
  });
});

// ─── Export / Import round-trip ───────────────────────────────────────────────

describe('exportJSON', () => {
  it('returns valid JSON with expected sections', () => {
    const json = exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('config');
    expect(parsed).toHaveProperty('enemies');
    expect(parsed).toHaveProperty('weapons');
    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('characters');
    expect(parsed).toHaveProperty('upgrades');
  });

  it('includes override values in export', () => {
    setOverride('enemies', 'slime', 'hp', 777);
    const json = exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.enemies.slime.hp).toBe(777);
  });
});

describe('importJSON', () => {
  it('round-trip: export then import produces same values', () => {
    setOverride('enemies', 'slime', 'hp', 500);
    setOverride('config', null, 'player.maxHp', 800);
    const json = exportJSON();

    resetAllOverrides();
    importJSON(json);

    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(500);
    expect(getConfig().player.maxHp).toBe(800);
  });

  it('import stores only delta (non-default values)', () => {
    const defaultHp = getEnemyDefaults().find(e => e.id === 'slime').hp;
    // Export with no overrides (all defaults)
    const json = exportJSON();
    resetAllOverrides();
    importJSON(json);

    // Should have empty overrides since nothing differs from defaults
    const raw = mockStorage.getItem(OVERRIDE_KEY);
    if (raw) {
      const ov = JSON.parse(raw);
      // enemies section should not contain slime override (it's at default)
      expect(ov.enemies?.slime?.hp).toBeUndefined();
    }
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(defaultHp);
  });

  it('throws on invalid JSON without corrupting state', () => {
    setOverride('enemies', 'slime', 'hp', 123);
    expect(() => importJSON('not valid json')).toThrow();
    // State should be unchanged
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(123);
  });

  it('throws on non-object JSON without corrupting state', () => {
    setOverride('enemies', 'slime', 'hp', 123);
    expect(() => importJSON('"just a string"')).toThrow();
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(123);
  });
});

// ─── Persistence ─────────────────────────────────────────────────────────────

describe('persistence via localStorage', () => {
  it('reloadCache re-applies stored overrides', () => {
    setOverride('enemies', 'slime', 'hp', 42);
    // Simulate reload by calling reloadCache again
    reloadCache();
    expect(getEnemyTypes().find(e => e.id === 'slime').hp).toBe(42);
  });

  it('overrides persist across reloadCache calls', () => {
    setOverride('weapons', 'arrow', 'damage', 99);
    reloadCache();
    reloadCache();
    expect(getWeaponDefs().find(w => w.id === 'arrow').damage).toBe(99);
  });
});
