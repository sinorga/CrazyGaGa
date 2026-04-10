import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/player.js';
import { CONFIG } from '../src/config.js';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player(500, 500);
  });

  describe('initialization', () => {
    it('starts at given position', () => {
      expect(player.x).toBe(500);
      expect(player.y).toBe(500);
    });

    it('starts with full HP', () => {
      expect(player.hp).toBe(CONFIG.player.maxHp);
      expect(player.maxHp).toBe(CONFIG.player.maxHp);
    });

    it('starts at level 1 with 0 EXP', () => {
      expect(player.level).toBe(1);
      expect(player.exp).toBe(0);
    });

    it('has default stats', () => {
      expect(player.speed).toBe(CONFIG.player.speed);
      expect(player.armor).toBe(0);
      expect(player.regen).toBe(0);
      expect(player.damageMultiplier).toBe(1);
      expect(player.cooldownMultiplier).toBe(1);
    });
  });

  describe('movement', () => {
    const CW = 2000, CH = 2000; // large canvas so clamping doesn't affect small moves

    it('moves in direction at speed * dt', () => {
      player.move({ x: 1, y: 0 }, 1.0, CW, CH);
      expect(player.x).toBeCloseTo(500 + CONFIG.player.speed, 1);
      expect(player.y).toBe(500);
    });

    it('moves diagonally normalized', () => {
      player.move({ x: 0.707, y: 0.707 }, 1.0, CW, CH);
      const expected = CONFIG.player.speed * 0.707;
      expect(player.x).toBeCloseTo(500 + expected, 0);
      expect(player.y).toBeCloseTo(500 + expected, 0);
    });

    it('clamps to room wall boundaries', () => {
      const wall = CONFIG.room.wallThickness;
      player.move({ x: -1, y: 0 }, 100, 800, 600); // move far left
      expect(player.x).toBeGreaterThanOrEqual(wall + player.radius);

      player.x = 500;
      player.move({ x: 1, y: 0 }, 100, 800, 600); // move far right
      expect(player.x).toBeLessThanOrEqual(800 - wall - player.radius);
    });

    it('uses modified speed from passives', () => {
      player.applyPassive('speed', 0.5, 'percent');
      player.move({ x: 1, y: 0 }, 1.0, CW, CH);
      expect(player.x).toBeCloseTo(500 + CONFIG.player.speed * 1.5, 1);
    });
  });

  describe('damage and invincibility', () => {
    it('takes damage reducing HP', () => {
      player.takeDamage(20);
      expect(player.hp).toBe(CONFIG.player.maxHp - 20);
    });

    it('armor reduces damage (minimum 1)', () => {
      player.armor = 15;
      player.takeDamage(10);
      expect(player.hp).toBe(CONFIG.player.maxHp - 1); // min 1 damage
    });

    it('becomes invincible after taking damage', () => {
      player.takeDamage(10);
      expect(player.invincible).toBe(true);
    });

    it('ignores damage while invincible', () => {
      player.takeDamage(10);
      const hpAfterFirst = player.hp;
      player.takeDamage(10);
      expect(player.hp).toBe(hpAfterFirst); // no additional damage
    });

    it('invincibility expires after duration', () => {
      player.takeDamage(10);
      player.update(CONFIG.player.invincibleDuration + 0.01);
      expect(player.invincible).toBe(false);
    });
  });

  describe('death', () => {
    it('dies when HP reaches 0', () => {
      player.takeDamage(CONFIG.player.maxHp);
      expect(player.hp).toBe(0);
      expect(player.alive).toBe(false);
    });

    it('HP does not go below 0', () => {
      player.takeDamage(9999);
      expect(player.hp).toBe(0);
    });
  });

  describe('stats and passives', () => {
    it('applies flat stat bonus', () => {
      player.applyPassive('maxHp', 20, 'flat');
      expect(player.maxHp).toBe(CONFIG.player.maxHp + 20);
    });

    it('applies percent stat bonus', () => {
      player.applyPassive('damage', 0.12, 'percent');
      expect(player.damageMultiplier).toBeCloseTo(1.12, 5);
    });

    it('stacks multiple passives', () => {
      player.applyPassive('maxHp', 20, 'flat');
      player.applyPassive('maxHp', 20, 'flat');
      expect(player.maxHp).toBe(CONFIG.player.maxHp + 40);
    });

    it('applies cooldown reduction', () => {
      player.applyPassive('cooldown', -0.08, 'percent');
      expect(player.cooldownMultiplier).toBeCloseTo(0.92, 5);
    });

    it('maxHp increase also heals that amount', () => {
      player.takeDamage(10);
      player.update(1); // clear invincibility
      const hpBefore = player.hp;
      player.applyPassive('maxHp', 20, 'flat');
      expect(player.hp).toBe(hpBefore + 20);
    });

    it('applies pickup range bonus', () => {
      const baseMagnet = CONFIG.player.magnetRange;
      player.applyPassive('pickupRange', 0.30, 'percent');
      expect(player.magnetRange).toBeCloseTo(baseMagnet * 1.30, 1);
    });
  });

  describe('regeneration', () => {
    it('regenerates HP over time', () => {
      player.takeDamage(50);
      player.update(CONFIG.player.invincibleDuration + 0.01); // clear invincibility
      player.regen = 10;
      player.update(1.0);
      expect(player.hp).toBeCloseTo(CONFIG.player.maxHp - 50 + 10, 1);
    });

    it('does not regen above maxHp', () => {
      player.regen = 100;
      player.update(1.0);
      expect(player.hp).toBe(player.maxHp);
    });
  });

  describe('experience', () => {
    it('adds EXP', () => {
      player.addExp(5);
      expect(player.exp).toBe(5);
    });

    it('calculates EXP threshold for level', () => {
      const threshold = player.expToNextLevel();
      expect(threshold).toBe(CONFIG.leveling.baseExpToLevel);
    });

    it('threshold increases with level', () => {
      player.level = 5;
      const threshold = player.expToNextLevel();
      expect(threshold).toBeGreaterThan(CONFIG.leveling.baseExpToLevel);
    });

    it('detects level up when EXP reaches threshold', () => {
      const threshold = player.expToNextLevel();
      player.addExp(threshold);
      expect(player.shouldLevelUp()).toBe(true);
    });

    it('performs level up, incrementing level and carrying over EXP', () => {
      const threshold = player.expToNextLevel();
      player.addExp(threshold + 3);
      player.levelUp();
      expect(player.level).toBe(2);
      expect(player.exp).toBe(3);
    });

    it('applies expBonus to gained EXP', () => {
      player.applyPassive('expBonus', 0.50, 'percent');
      player.addExp(10);
      expect(player.exp).toBe(15); // 10 * 1.5
    });
  });
});
