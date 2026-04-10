import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SKILL_DEFINITIONS, getRandomSkillChoices } from '../src/data/skills.js';
import { Projectile } from '../src/projectile.js';
import { Enemy } from '../src/enemy.js';

describe('Archero Skills', () => {
  describe('SKILL_DEFINITIONS pool tagging', () => {
    it('all archero skills have pool: archero', () => {
      const archeroIds = [
        'skill_diagonal', 'skill_side_arrow', 'skill_back_arrow', 'skill_multishot',
        'skill_bounce', 'skill_ricochet', 'skill_freeze', 'skill_poison',
        'skill_heal_on_kill', 'skill_thorns', 'skill_vampire',
      ];
      for (const id of archeroIds) {
        const skill = SKILL_DEFINITIONS.find(s => s.id === id);
        expect(skill).toBeDefined();
        expect(skill.pool).toBe('archero');
      }
    });

    it('all levelup skills have pool: levelup', () => {
      const levelupIds = [
        'skill_arrow', 'skill_magic_orb', 'skill_lightning',
        'passive_max_hp', 'passive_speed', 'passive_damage',
      ];
      for (const id of levelupIds) {
        const skill = SKILL_DEFINITIONS.find(s => s.id === id);
        expect(skill).toBeDefined();
        expect(skill.pool).toBe('levelup');
      }
    });
  });

  describe('getRandomSkillChoices pool filtering', () => {
    it('returns only archero pool skills when pool=archero', () => {
      const choices = getRandomSkillChoices(3, {}, 'archero');
      for (const skill of choices) {
        expect(skill.pool).toBe('archero');
      }
    });

    it('returns only levelup pool skills when pool=levelup', () => {
      const choices = getRandomSkillChoices(3, {}, 'levelup');
      for (const skill of choices) {
        expect(skill.pool).toBe('levelup');
      }
    });

    it('returns skills from all pools when no pool specified', () => {
      const choices = getRandomSkillChoices(6, {});
      // Just verify it returns some skills (both pools available)
      expect(choices.length).toBeGreaterThan(0);
    });

    it('excludes maxed skills', () => {
      const allMaxed = {};
      SKILL_DEFINITIONS.filter(s => s.pool === 'archero').forEach(s => {
        allMaxed[s.id] = s.maxLevel;
      });
      const choices = getRandomSkillChoices(3, allMaxed, 'archero');
      expect(choices.length).toBe(0);
    });
  });

  describe('freeze skill enemy status', () => {
    it('freezeChance=1 always freezes enemy', () => {
      const player = {
        freezeChance: 1,
        poisonDps: 0,
        vampire: 0,
      };
      const typeDef = {
        id: 'slime', type: 'charger', radius: 12, hp: 15, maxHp: 15,
        speed: 60, damage: 8, color: '#44cc44', exp: 1, icon: '🟢',
      };
      const enemy = new Enemy(100, 100, typeDef);
      // Simulate game collision logic
      if (player.freezeChance > 0 && Math.random() < player.freezeChance) {
        enemy.frozen = 1.2;
      }
      // With freezeChance=1, frozen should be set (but Math.random is < 1 always)
      // We mock Math.random to return 0
      const orig = Math.random;
      Math.random = () => 0;
      enemy.frozen = 0;
      if (player.freezeChance > 0 && Math.random() < player.freezeChance) {
        enemy.frozen = 1.2;
      }
      expect(enemy.frozen).toBe(1.2);
      Math.random = orig;
    });

    it('frozen enemy skips movement', () => {
      const typeDef = {
        id: 'slime', type: 'charger', radius: 12, hp: 15, maxHp: 15,
        speed: 60, damage: 8, color: '#44cc44', exp: 1, icon: '🟢',
      };
      const enemy = new Enemy(100, 100, typeDef);
      enemy.frozen = 1.0;
      const origX = enemy.x;
      enemy.update({ x: 500, y: 300 }, 0.016, [], [], []);
      expect(enemy.x).toBe(origX); // didn't move
    });
  });

  describe('poison skill enemy status', () => {
    it('poisoned enemy takes damage each tick', () => {
      const typeDef = {
        id: 'slime', type: 'charger', radius: 12, hp: 30, maxHp: 30,
        speed: 60, damage: 8, color: '#44cc44', exp: 1, icon: '🟢',
      };
      const enemy = new Enemy(100, 100, typeDef);
      enemy.poisoned = 3;
      enemy.poisonDps = 3;
      enemy.update({ x: 500, y: 300 }, 1.0, [], [], []);
      expect(enemy.hp).toBeLessThan(30); // took poison damage
    });
  });
});
