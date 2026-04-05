import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponManager, createWeaponInstance } from '../src/weapons.js';
import { Enemy } from '../src/enemy.js';
import { Player } from '../src/player.js';

describe('Weapon Patterns', () => {
  let weaponManager;
  let player;
  let enemies;
  let projectiles;

  beforeEach(() => {
    weaponManager = new WeaponManager();
    player = new Player(500, 500);
    projectiles = [];
  });

  describe('Chain Lightning', () => {
    beforeEach(() => {
      weaponManager.addWeapon('lightning');
      enemies = [
        new Enemy(600, 500, { id: 'a', name: 'A', type: 'charger', radius: 12, hp: 50, speed: 0, damage: 5, color: '#fff', exp: 1 }),
        new Enemy(700, 500, { id: 'b', name: 'B', type: 'charger', radius: 12, hp: 50, speed: 0, damage: 5, color: '#fff', exp: 1 }),
        new Enemy(800, 500, { id: 'c', name: 'C', type: 'charger', radius: 12, hp: 50, speed: 0, damage: 5, color: '#fff', exp: 1 }),
      ];
    });

    it('strikes nearest enemy first', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      // First enemy should be hit
      expect(enemies[0].hp).toBeLessThan(50);
    });

    it('chains to nearby enemies up to chainCount', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      // chainCount=2 at level 1, so first enemy + 2 chains = 3 enemies hit
      expect(enemies[0].hp).toBeLessThan(50);
      expect(enemies[1].hp).toBeLessThan(50);
      expect(enemies[2].hp).toBeLessThan(50);
    });

    it('stores chain visual targets', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      expect(weapon.chainTargets).toBeDefined();
      expect(weapon.chainTargets.length).toBeGreaterThan(1);
    });

    it('does not chain to enemies beyond chainRange', () => {
      // Move third enemy far away
      enemies[2].x = 2000;
      enemies[2].y = 2000;
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      expect(enemies[0].hp).toBeLessThan(50);
      expect(enemies[1].hp).toBeLessThan(50);
      expect(enemies[2].hp).toBe(50); // too far to chain
    });

    it('does not fire while moving', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, true);
      expect(enemies[0].hp).toBe(50);
    });
  });

  describe('Area Weapon (Holy Sword)', () => {
    beforeEach(() => {
      weaponManager.addWeapon('holy_sword');
      enemies = [
        new Enemy(600, 500, { id: 'a', name: 'A', type: 'charger', radius: 12, hp: 100, speed: 0, damage: 5, color: '#fff', exp: 1 }),
        new Enemy(700, 500, { id: 'b', name: 'B', type: 'charger', radius: 12, hp: 100, speed: 0, damage: 5, color: '#fff', exp: 1 }),
        new Enemy(800, 500, { id: 'c', name: 'C', type: 'charger', radius: 12, hp: 100, speed: 0, damage: 5, color: '#fff', exp: 1 }),
      ];
    });

    it('creates damage areas when cooldown expires', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      expect(weapon.areas).toBeDefined();
      expect(weapon.areas.length).toBe(3); // holy_sword has count: 3
    });

    it('damage areas have correct properties', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      const area = weapon.areas[0];
      expect(area.duration).toBe(0.5);
      expect(area.tickRate).toBe(0.5);
      expect(area.damage).toBeGreaterThan(0);
      expect(area.radius).toBeGreaterThan(0);
    });

    it('area timer counts down', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      const initialTimer = weapon.areas[0].timer;
      // Simulate area tick
      weapon.areas[0].timer -= 0.1;
      expect(weapon.areas[0].timer).toBeLessThan(initialTimer);
    });
  });

  describe('Boomerang', () => {
    beforeEach(() => {
      weaponManager.addWeapon('boomerang');
      enemies = [
        new Enemy(600, 500, { id: 'a', name: 'A', type: 'charger', radius: 12, hp: 100, speed: 0, damage: 5, color: '#fff', exp: 1 }),
      ];
    });

    it('fires a projectile with boomerang properties', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      expect(projectiles.length).toBe(1);
      const proj = projectiles[0];
      expect(proj.isBoomerang).toBe(true);
      expect(proj.returning).toBe(false);
      expect(proj.maxRange).toBeGreaterThan(0);
      expect(proj.pierce).toBe(999); // unlimited pierce
    });

    it('boomerang returns after reaching maxRange', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      const proj = projectiles[0];

      // Simulate moving past maxRange by placing projectile far away
      const maxRange = proj.maxRange;
      const dirX = proj.vx / proj.speed;
      const dirY = proj.vy / proj.speed;
      proj.x = proj.startX + dirX * (maxRange + 10);
      proj.y = proj.startY + dirY * (maxRange + 10);

      // Update triggers return logic
      proj.update(0.01);
      expect(proj.returning).toBe(true);
    });

    it('boomerang homes toward player on return and dies when close', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, false);
      const proj = projectiles[0];

      // Force into returning state near player
      proj.returning = true;
      proj.x = player.x + 15;
      proj.y = player.y;
      proj.update(0.01);
      // Should be dead since within 20 units of player
      expect(proj.alive).toBe(false);
    });

    it('does not fire while moving', () => {
      const weapon = weaponManager.weapons[0];
      weapon.cooldownTimer = 0;
      weaponManager.update(0.01, player, enemies, projectiles, true);
      expect(projectiles.length).toBe(0);
    });
  });
});
