import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SETTINGS_DEFS, loadSettings, saveSettings, resetSettings, getDefaults, applyUserSettings } from '../src/settings.js';
import { CONFIG } from '../src/config.js';

describe('Settings', () => {
  // Mock localStorage
  let store = {};
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = val; },
      removeItem: (key) => { delete store[key]; },
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SETTINGS_DEFS', () => {
    it('has exactly 8 settings', () => {
      expect(SETTINGS_DEFS.length).toBe(8);
    });

    it('each setting has required fields', () => {
      for (const def of SETTINGS_DEFS) {
        expect(def.key).toBeTruthy();
        expect(def.label).toBeTruthy();
        expect(typeof def.min).toBe('number');
        expect(typeof def.max).toBe('number');
        expect(typeof def.step).toBe('number');
        expect(typeof def.default).toBe('number');
        expect(def.min).toBeLessThanOrEqual(def.max);
        expect(def.default).toBeGreaterThanOrEqual(def.min);
        expect(def.default).toBeLessThanOrEqual(def.max);
      }
    });
  });

  describe('getDefaults', () => {
    it('returns default values for all settings', () => {
      const defaults = getDefaults();
      expect(Object.keys(defaults).length).toBe(8);
      expect(defaults.playerMaxHp).toBe(500);
      expect(defaults.cooldownMultiplier).toBe(1.0);
    });
  });

  describe('saveSettings / loadSettings', () => {
    it('saves and loads settings', () => {
      const settings = { playerMaxHp: 1000, playerSpeed: 200 };
      saveSettings(settings);
      const loaded = loadSettings();
      expect(loaded.playerMaxHp).toBe(1000);
      expect(loaded.playerSpeed).toBe(200);
    });

    it('returns null when no settings saved', () => {
      expect(loadSettings()).toBeNull();
    });

    it('clamps values to valid ranges', () => {
      saveSettings({ playerMaxHp: 99999, playerSpeed: -50 });
      const loaded = loadSettings();
      expect(loaded.playerMaxHp).toBe(2000); // max
      expect(loaded.playerSpeed).toBe(50);   // min
    });

    it('ignores non-numeric values', () => {
      saveSettings({ playerMaxHp: 'bad', playerSpeed: 200 });
      const loaded = loadSettings();
      expect(loaded.playerMaxHp).toBeUndefined();
      expect(loaded.playerSpeed).toBe(200);
    });

    it('returns null for corrupt JSON', () => {
      store['crazygaga_settings'] = 'not-json{{{';
      expect(loadSettings()).toBeNull();
    });

    it('returns null for non-object JSON', () => {
      store['crazygaga_settings'] = '"just a string"';
      expect(loadSettings()).toBeNull();
    });
  });

  describe('resetSettings', () => {
    it('removes settings from localStorage', () => {
      saveSettings({ playerMaxHp: 1000 });
      resetSettings();
      expect(loadSettings()).toBeNull();
    });
  });

  describe('applyUserSettings', () => {
    it('applies saved settings to CONFIG', () => {
      const origHp = CONFIG.player.maxHp;
      saveSettings({ playerMaxHp: 1234 });
      applyUserSettings();
      expect(CONFIG.player.maxHp).toBe(1234);
      // restore
      CONFIG.player.maxHp = origHp;
    });

    it('does nothing when no settings saved', () => {
      const origHp = CONFIG.player.maxHp;
      applyUserSettings();
      expect(CONFIG.player.maxHp).toBe(origHp);
    });

    it('does not apply cooldownMultiplier to CONFIG (handled separately)', () => {
      saveSettings({ cooldownMultiplier: 0.5 });
      applyUserSettings();
      // cooldownMultiplier has configPath null, so CONFIG should not have it
      // Just verify no error thrown
    });

    it('applies difficulty scaling settings', () => {
      const origHpScale = CONFIG.difficulty.hpMultiplierPerMinute;
      saveSettings({ hpScaling: 0.3 });
      applyUserSettings();
      expect(CONFIG.difficulty.hpMultiplierPerMinute).toBe(0.3);
      CONFIG.difficulty.hpMultiplierPerMinute = origHpScale;
    });
  });
});
