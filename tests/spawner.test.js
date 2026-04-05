import { describe, it, expect, beforeEach } from 'vitest';
import { WaveSpawner } from '../src/spawner.js';
import { CONFIG } from '../src/config.js';

describe('WaveSpawner', () => {
  let spawner;

  beforeEach(() => {
    spawner = new WaveSpawner();
  });

  it('does not spawn before initial delay', () => {
    const enemies = spawner.update(0.5, { x: 500, y: 500 }, 0);
    expect(enemies.length).toBe(0);
  });

  it('spawns enemies after initial delay', () => {
    const enemies = spawner.update(CONFIG.waves.initialDelay + CONFIG.waves.spawnInterval + 0.1, { x: 500, y: 500 }, 0);
    expect(enemies.length).toBeGreaterThan(0);
  });

  it('respects max enemy cap', () => {
    const enemies = spawner.update(CONFIG.waves.initialDelay + CONFIG.waves.spawnInterval + 0.1, { x: 500, y: 500 }, CONFIG.waves.maxEnemies);
    expect(enemies.length).toBe(0);
  });

  it('spawns enemies at distance from player', () => {
    const playerPos = { x: 1500, y: 1500 };
    const enemies = spawner.update(CONFIG.waves.initialDelay + CONFIG.waves.spawnInterval + 0.1, playerPos, 0);
    enemies.forEach(e => {
      const dx = e.x - playerPos.x;
      const dy = e.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(CONFIG.waves.spawnDistanceMin * 0.9); // small tolerance
    });
  });

  it('increases enemies per wave over time', () => {
    // Simulate many waves
    let totalEarly = 0;
    let totalLate = 0;

    // Early spawns
    const early = spawner.update(CONFIG.waves.initialDelay + CONFIG.waves.spawnInterval + 0.1, { x: 500, y: 500 }, 0);
    totalEarly = early.length;

    // Reset and simulate late game
    const spawner2 = new WaveSpawner();
    spawner2.elapsed = 120; // simulate 2 minutes passed
    spawner2.waveCount = 60;
    const late = spawner2.update(CONFIG.waves.spawnInterval + 0.1, { x: 500, y: 500 }, 0);
    totalLate = late.length;

    expect(totalLate).toBeGreaterThanOrEqual(totalEarly);
  });

  it('only spawns unlocked enemy types', () => {
    // At time 0, only enemies with unlockTime <= 0 should appear
    const enemies = spawner.update(CONFIG.waves.initialDelay + CONFIG.waves.spawnInterval + 0.1, { x: 500, y: 500 }, 0);
    enemies.forEach(e => {
      expect(e.typeDef.unlockTime).toBeLessThanOrEqual(spawner.elapsed);
    });
  });
});
