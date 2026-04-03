import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy, behaviors } from '../src/enemy.js';

describe('Enemy', () => {
  let enemy;
  const playerPos = { x: 500, y: 500 };

  describe('basic enemy', () => {
    beforeEach(() => {
      enemy = new Enemy(100, 100, {
        id: 'slime', name: 'Test', type: 'charger',
        radius: 12, hp: 30, speed: 60, damage: 10,
        color: '#44cc44', exp: 2,
      });
    });

    it('initializes with type stats', () => {
      expect(enemy.x).toBe(100);
      expect(enemy.y).toBe(100);
      expect(enemy.hp).toBe(30);
      expect(enemy.maxHp).toBe(30);
      expect(enemy.speed).toBe(60);
      expect(enemy.damage).toBe(10);
      expect(enemy.radius).toBe(12);
      expect(enemy.alive).toBe(true);
    });

    it('takes damage', () => {
      enemy.takeDamage(10);
      expect(enemy.hp).toBe(20);
      expect(enemy.alive).toBe(true);
    });

    it('dies when HP reaches 0', () => {
      enemy.takeDamage(30);
      expect(enemy.hp).toBe(0);
      expect(enemy.alive).toBe(false);
    });

    it('HP does not go below 0', () => {
      enemy.takeDamage(999);
      expect(enemy.hp).toBe(0);
    });
  });

  describe('charger behavior', () => {
    it('moves toward player', () => {
      enemy = new Enemy(100, 100, {
        id: 'slime', name: 'Test', type: 'charger',
        radius: 12, hp: 30, speed: 100, damage: 10,
        color: '#44cc44', exp: 2,
      });
      const startX = enemy.x;
      behaviors.charger(enemy, playerPos, 1.0);
      // Should have moved toward (500,500)
      expect(enemy.x).toBeGreaterThan(startX);
      expect(enemy.y).toBeGreaterThan(100);
    });

    it('normalizes movement speed', () => {
      enemy = new Enemy(500, 400, {
        id: 'slime', name: 'Test', type: 'charger',
        radius: 12, hp: 30, speed: 100, damage: 10,
        color: '#44cc44', exp: 2,
      });
      behaviors.charger(enemy, playerPos, 1.0);
      // Moved 100 units toward player (pure Y direction)
      expect(enemy.x).toBeCloseTo(500, 0);
      expect(enemy.y).toBeCloseTo(500, 0);
    });
  });

  describe('shooter behavior', () => {
    it('moves away when too close to player', () => {
      enemy = new Enemy(490, 500, {
        id: 'mage', name: 'Test', type: 'shooter',
        radius: 13, hp: 20, speed: 40, damage: 6,
        color: '#6644cc', exp: 3,
        behavior: { projectileSpeed: 150, projectileRadius: 5, projectileColor: '#aa66ff',
          projectileDamage: 10, fireRate: 1.5, preferredDistance: 200 },
      });
      behaviors.shooter(enemy, playerPos, 1.0);
      // Should move away (x decreases)
      expect(enemy.x).toBeLessThan(490);
    });

    it('fires projectile when cooldown ready', () => {
      enemy = new Enemy(300, 500, {
        id: 'mage', name: 'Test', type: 'shooter',
        radius: 13, hp: 20, speed: 40, damage: 6,
        color: '#6644cc', exp: 3,
        behavior: { projectileSpeed: 150, projectileRadius: 5, projectileColor: '#aa66ff',
          projectileDamage: 10, fireRate: 0.1, preferredDistance: 200 },
      });
      enemy.fireCooldown = 0;
      const projectiles = [];
      behaviors.shooter(enemy, playerPos, 0.1, projectiles);
      expect(projectiles.length).toBe(1);
      expect(projectiles[0].damage).toBe(10);
    });
  });

  describe('tank behavior', () => {
    it('moves toward player at its slow speed', () => {
      enemy = new Enemy(100, 500, {
        id: 'golem', name: 'Test', type: 'tank',
        radius: 22, hp: 120, speed: 25, damage: 20,
        color: '#888877', exp: 5,
      });
      behaviors.tank(enemy, playerPos, 1.0);
      expect(enemy.x).toBeCloseTo(125, 0); // moved 25 units toward player
    });
  });

  describe('exploder behavior', () => {
    it('moves toward player like charger', () => {
      enemy = new Enemy(100, 500, {
        id: 'bomb', name: 'Test', type: 'exploder',
        radius: 11, hp: 12, speed: 80, damage: 5,
        color: '#ff6644', exp: 2,
        behavior: { explosionRadius: 60, explosionDamage: 25, explosionColor: '#ff4400' },
      });
      const startX = enemy.x;
      behaviors.exploder(enemy, playerPos, 1.0);
      expect(enemy.x).toBeGreaterThan(startX);
    });
  });
});
