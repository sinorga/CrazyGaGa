import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Enemy } from '../src/enemy.js';
import { getEnemyType, getBossForPhase } from '../src/data/enemies.js';
import { bossAttacks, updateBossAI } from '../src/boss.js';

describe('Boss System', () => {
  describe('boss data', () => {
    it('getBossForPhase returns phase 1 boss', () => {
      const boss = getBossForPhase(1);
      expect(boss).toBeDefined();
      expect(boss.id).toBe('boss_demon');
      expect(boss.bossPhase).toBe(1);
    });

    it('getBossForPhase returns phase 2 boss', () => {
      const boss = getBossForPhase(2);
      expect(boss).toBeDefined();
      expect(boss.id).toBe('boss_lich');
      expect(boss.bossPhase).toBe(2);
    });
  });

  describe('boss attacks', () => {
    let boss;
    const playerPos = { x: 500, y: 500 };

    beforeEach(() => {
      const bossDef = getBossForPhase(1);
      boss = new Enemy(300, 300, bossDef);
    });

    it('charge attack moves boss toward player at high speed', () => {
      const attack = { type: 'charge', speed: 200, duration: 1.0, cooldown: 5 };
      const startX = boss.x;
      const startY = boss.y;
      bossAttacks.charge(boss, playerPos, 0.5, attack);
      // Boss should move toward player
      expect(boss.x).toBeGreaterThan(startX);
      expect(boss.y).toBeGreaterThan(startY);
    });

    it('bullet_ring creates projectiles in a circle', () => {
      const attack = { type: 'bullet_ring', count: 12, speed: 120, cooldown: 3 };
      const projectiles = [];
      bossAttacks.bullet_ring(boss, playerPos, attack, projectiles);
      expect(projectiles.length).toBe(12);
      // All projectiles should originate from boss position
      for (const p of projectiles) {
        expect(p.x).toBe(boss.x);
        expect(p.y).toBe(boss.y);
        expect(p.isEnemy).toBe(true);
      }
    });

    it('bullet_spiral creates projectiles in a spiral pattern', () => {
      const attack = { type: 'bullet_spiral', count: 20, speed: 100, cooldown: 4 };
      const projectiles = [];
      boss._spiralAngle = 0;
      bossAttacks.bullet_spiral(boss, playerPos, attack, projectiles);
      expect(projectiles.length).toBe(20);
    });

    it('teleport moves boss to a random position near player', () => {
      const attack = { type: 'teleport', cooldown: 6 };
      const oldX = boss.x;
      const oldY = boss.y;
      bossAttacks.teleport(boss, playerPos, attack);
      // Boss should have moved
      const moved = boss.x !== oldX || boss.y !== oldY;
      expect(moved).toBe(true);
    });

    it('summon creates minion enemies', () => {
      const attack = { type: 'summon', summonId: 'skeleton', count: 6, cooldown: 8 };
      const spawnedMinions = [];
      bossAttacks.summon(boss, playerPos, attack, spawnedMinions);
      expect(spawnedMinions.length).toBe(6);
      for (const m of spawnedMinions) {
        expect(m.typeDef.id).toBe('skeleton');
      }
    });
  });

  describe('boss AI update loop', () => {
    let boss;
    const playerPos = { x: 500, y: 500 };

    beforeEach(() => {
      const bossDef = getBossForPhase(1);
      boss = new Enemy(300, 300, bossDef);
      boss._attackCooldowns = {};
      boss._currentAttack = null;
      boss._attackTimer = 0;
    });

    it('cycles through attacks based on cooldowns', () => {
      const projectiles = [];
      const spawnedMinions = [];
      // Initialize cooldowns to 0 so attacks can fire
      for (const atk of boss.typeDef.attacks) {
        boss._attackCooldowns[atk.type] = 0;
      }

      // Update should trigger an attack
      updateBossAI(boss, playerPos, 0.1, projectiles, spawnedMinions);
      // Boss should have started an attack or be in cooldown
      const hasActivity = boss._currentAttack !== null ||
        Object.values(boss._attackCooldowns).some(cd => cd > 0);
      expect(hasActivity).toBe(true);
    });

    it('decrements attack cooldowns over time', () => {
      const projectiles = [];
      const spawnedMinions = [];
      boss._attackCooldowns = { charge: 5, bullet_ring: 3 };

      updateBossAI(boss, playerPos, 1.0, projectiles, spawnedMinions);

      expect(boss._attackCooldowns.charge).toBeCloseTo(4.0);
      expect(boss._attackCooldowns.bullet_ring).toBeCloseTo(2.0);
    });

    it('moves toward player slowly when not attacking', () => {
      const projectiles = [];
      const spawnedMinions = [];
      // Set high cooldowns so no attacks trigger
      boss._attackCooldowns = { charge: 99, bullet_ring: 99 };
      const startX = boss.x;

      updateBossAI(boss, playerPos, 1.0, projectiles, spawnedMinions);

      expect(boss.x).toBeGreaterThan(startX);
    });
  });
});
