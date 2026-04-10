import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadMeta, saveMeta, resetMeta, purchaseUpgrade, unlockCharacter, selectCharacter, getUpgradeBonus } from '../src/meta.js';

describe('Meta Persistence', () => {
  let store = {};
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = val; },
      removeItem: (key) => { delete store[key]; },
    });
  });

  describe('loadMeta / saveMeta / resetMeta', () => {
    it('returns defaults when no data stored', () => {
      const meta = loadMeta();
      expect(meta.gold).toBe(0);
      expect(meta.upgrades).toEqual({});
      expect(meta.unlocked).toEqual(['warrior']);
      expect(meta.selected).toBe('warrior');
    });

    it('saves and loads meta', () => {
      const meta = loadMeta();
      meta.gold = 500;
      saveMeta(meta);
      const loaded = loadMeta();
      expect(loaded.gold).toBe(500);
    });

    it('resetMeta clears stored data', () => {
      saveMeta({ gold: 999, upgrades: {}, unlocked: ['warrior'], selected: 'warrior' });
      resetMeta();
      const meta = loadMeta();
      expect(meta.gold).toBe(0);
    });

    it('handles corrupt JSON gracefully', () => {
      store['crazygaga_meta'] = 'not-valid-json{{{';
      const meta = loadMeta();
      expect(meta.gold).toBe(0);
    });
  });

  describe('purchaseUpgrade', () => {
    it('purchases upgrade with sufficient gold', () => {
      const meta = loadMeta();
      meta.gold = 200;
      const result = purchaseUpgrade(meta, 'hp_boost');
      expect(result).toBe(true);
      expect(meta.gold).toBe(100); // cost 100
      expect(meta.upgrades.hp_boost).toBe(1);
    });

    it('fails with insufficient gold', () => {
      const meta = loadMeta();
      meta.gold = 50;
      const result = purchaseUpgrade(meta, 'hp_boost');
      expect(result).toBe(false);
      expect(meta.gold).toBe(50);
    });

    it('fails at max level', () => {
      const meta = loadMeta();
      meta.gold = 99999;
      meta.upgrades.hp_boost = 5; // max
      const result = purchaseUpgrade(meta, 'hp_boost');
      expect(result).toBe(false);
    });

    it('fails for unknown upgrade', () => {
      const meta = loadMeta();
      meta.gold = 999;
      expect(purchaseUpgrade(meta, 'nonexistent')).toBe(false);
    });

    it('costs increase per level', () => {
      const meta = loadMeta();
      meta.gold = 10000;
      purchaseUpgrade(meta, 'hp_boost'); // cost 100
      const goldAfter1 = meta.gold;
      purchaseUpgrade(meta, 'hp_boost'); // cost 200
      const goldAfter2 = meta.gold;
      expect(goldAfter1 - goldAfter2).toBe(200);
    });
  });

  describe('unlockCharacter', () => {
    it('unlocks character with sufficient gold', () => {
      const meta = loadMeta();
      meta.gold = 600;
      const result = unlockCharacter(meta, 'mage');
      expect(result).toBe(true);
      expect(meta.gold).toBe(100);
      expect(meta.unlocked).toContain('mage');
    });

    it('fails with insufficient gold', () => {
      const meta = loadMeta();
      meta.gold = 100;
      expect(unlockCharacter(meta, 'mage')).toBe(false);
    });

    it('fails if already unlocked', () => {
      const meta = loadMeta();
      meta.gold = 999;
      expect(unlockCharacter(meta, 'warrior')).toBe(false); // already unlocked
    });

    it('fails for unknown character', () => {
      const meta = loadMeta();
      meta.gold = 999;
      expect(unlockCharacter(meta, 'nonexistent')).toBe(false);
    });
  });

  describe('selectCharacter', () => {
    it('selects an unlocked character', () => {
      const meta = loadMeta();
      meta.unlocked.push('mage');
      expect(selectCharacter(meta, 'mage')).toBe(true);
      expect(meta.selected).toBe('mage');
    });

    it('fails for locked character', () => {
      const meta = loadMeta();
      expect(selectCharacter(meta, 'mage')).toBe(false);
      expect(meta.selected).toBe('warrior');
    });
  });

  describe('getUpgradeBonus', () => {
    it('returns zero for no upgrades', () => {
      const meta = loadMeta();
      const bonus = getUpgradeBonus(meta, 'maxHp');
      expect(bonus.flat).toBe(0);
      expect(bonus.percent).toBe(0);
    });

    it('calculates flat bonus for HP upgrade', () => {
      const meta = loadMeta();
      meta.upgrades.hp_boost = 3;
      const bonus = getUpgradeBonus(meta, 'maxHp');
      expect(bonus.flat).toBe(150); // 50 * 3
    });

    it('calculates percent bonus for damage upgrade', () => {
      const meta = loadMeta();
      meta.upgrades.damage_boost = 2;
      const bonus = getUpgradeBonus(meta, 'damage');
      expect(bonus.percent).toBeCloseTo(0.2); // 0.1 * 2
    });
  });
});
