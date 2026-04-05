import { describe, it, expect, beforeEach } from 'vitest';
import { getEvolutionRecipe, canEvolve, EVOLUTION_RECIPES } from '../src/data/evolutions.js';
import { getWeaponDefinition } from '../src/data/weapons.js';
import { WeaponManager } from '../src/weapons.js';

describe('Weapon Evolution', () => {
  describe('evolution recipes', () => {
    it('has recipes for all base weapons', () => {
      const baseWeapons = ['arrow', 'magic_orb', 'lightning', 'fire_circle', 'boomerang', 'holy_sword'];
      for (const id of baseWeapons) {
        const recipe = getEvolutionRecipe(id);
        expect(recipe).toBeDefined();
        expect(recipe.baseWeaponId).toBe(id);
        expect(recipe.evolvedWeaponId).toBeTruthy();
        expect(recipe.requiredPassive).toBeTruthy();
      }
    });

    it('returns null for unknown weapon', () => {
      expect(getEvolutionRecipe('nonexistent')).toBeNull();
    });

    it('all evolved weapons have definitions', () => {
      for (const recipe of EVOLUTION_RECIPES) {
        const def = getWeaponDefinition(recipe.evolvedWeaponId);
        expect(def).toBeDefined();
        expect(def.evolved).toBe(true);
      }
    });
  });

  describe('canEvolve', () => {
    it('returns false if weapon is below max level', () => {
      expect(canEvolve('arrow', 5, { damage: 1 })).toBe(false);
    });

    it('returns false if required passive is not owned', () => {
      expect(canEvolve('arrow', 8, {})).toBe(false);
    });

    it('returns true when weapon is max level and passive is owned', () => {
      expect(canEvolve('arrow', 8, { damage: 1 })).toBe(true);
    });

    it('returns false for non-existent weapon', () => {
      expect(canEvolve('nonexistent', 8, { damage: 1 })).toBe(false);
    });

    it('works for each recipe', () => {
      for (const recipe of EVOLUTION_RECIPES) {
        const passives = { [recipe.requiredPassive]: 1 };
        expect(canEvolve(recipe.baseWeaponId, 8, passives)).toBe(true);
        expect(canEvolve(recipe.baseWeaponId, 7, passives)).toBe(false);
      }
    });
  });

  describe('weapon replacement', () => {
    it('replaces base weapon with evolved form in WeaponManager', () => {
      const manager = new WeaponManager();
      manager.addWeapon('arrow');
      expect(manager.hasWeapon('arrow')).toBe(true);

      // Simulate evolution: remove base, add evolved
      const recipe = getEvolutionRecipe('arrow');
      manager.weapons = manager.weapons.filter(w => w.id !== recipe.baseWeaponId);
      manager.addWeapon(recipe.evolvedWeaponId);

      expect(manager.hasWeapon('arrow')).toBe(false);
      expect(manager.hasWeapon('arrow_evolved')).toBe(true);
    });

    it('evolved weapon has enhanced stats', () => {
      const base = getWeaponDefinition('arrow');
      const evolved = getWeaponDefinition('arrow_evolved');
      expect(evolved.damage).toBeGreaterThan(base.damage);
      expect(evolved.config.pierce).toBeGreaterThan(base.config.pierce);
    });
  });
});
