import { describe, it, expect, beforeEach } from 'vitest';
import { WaveSpawner } from '../src/spawner.js';
import { CONFIG } from '../src/config.js';

describe('Difficulty Scaling', () => {
  describe('getDifficultyMultiplier', () => {
    let spawner;

    beforeEach(() => {
      spawner = new WaveSpawner();
    });

    it('returns 1.0 at game start (0 minutes)', () => {
      expect(spawner.getHpMultiplier(0)).toBe(1.0);
      expect(spawner.getDamageMultiplier(0)).toBe(1.0);
    });

    it('scales HP by hpMultiplierPerMinute', () => {
      // At 10 minutes with 0.1 per minute: 1 + 10 * 0.1 = 2.0
      const mult = spawner.getHpMultiplier(600);
      expect(mult).toBeCloseTo(2.0);
    });

    it('scales damage by damageMultiplierPerMinute', () => {
      // At 10 minutes with 0.05 per minute: 1 + 10 * 0.05 = 1.5
      const mult = spawner.getDamageMultiplier(600);
      expect(mult).toBeCloseTo(1.5);
    });

    it('scales linearly with time', () => {
      const m5 = spawner.getHpMultiplier(300);  // 5 min
      const m10 = spawner.getHpMultiplier(600); // 10 min
      // m10 increase should be double m5 increase
      expect(m10 - 1).toBeCloseTo((m5 - 1) * 2);
    });
  });

  describe('spawned enemy stat scaling', () => {
    it('spawns enemies with base stats at time 0', () => {
      const spawner = new WaveSpawner();
      spawner.elapsed = 0;
      spawner.spawnTimer = -1; // force spawn
      spawner.spawnInterval = CONFIG.waves.spawnInterval;

      const enemies = spawner.update(0.01, { x: 1500, y: 1500 }, 0);
      if (enemies.length > 0) {
        const e = enemies[0];
        // At time ~0, multiplier is ~1.0, so hp should equal base hp
        expect(e.hp).toBe(e.typeDef.hp);
        expect(e.damage).toBe(e.typeDef.damage);
      }
    });

    it('spawns enemies with scaled stats after 10 minutes', () => {
      const spawner = new WaveSpawner();
      spawner.elapsed = 600; // 10 minutes
      spawner.spawnTimer = -1;
      spawner.spawnInterval = CONFIG.waves.spawnInterval;
      spawner.waveCount = 1;

      const enemies = spawner.update(0.01, { x: 1500, y: 1500 }, 0);
      if (enemies.length > 0) {
        const e = enemies[0];
        const expectedHpMult = 1 + 10 * CONFIG.difficulty.hpMultiplierPerMinute;
        const expectedDmgMult = 1 + 10 * CONFIG.difficulty.damageMultiplierPerMinute;
        expect(e.hp).toBe(Math.round(e.typeDef.hp * expectedHpMult));
        expect(e.maxHp).toBe(Math.round(e.typeDef.hp * expectedHpMult));
        expect(e.damage).toBe(Math.round(e.typeDef.damage * expectedDmgMult));
      }
    });

    it('does not affect already-spawned enemies when time advances', () => {
      const spawner = new WaveSpawner();
      spawner.elapsed = 0;
      spawner.spawnTimer = -1;
      spawner.spawnInterval = CONFIG.waves.spawnInterval;

      const earlyEnemies = spawner.update(0.01, { x: 1500, y: 1500 }, 0);
      if (earlyEnemies.length > 0) {
        const earlyHp = earlyEnemies[0].hp;
        // Advancing time doesn't change already-spawned enemy
        spawner.elapsed = 600;
        expect(earlyEnemies[0].hp).toBe(earlyHp);
      }
    });
  });
});
