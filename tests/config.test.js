import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config.js';

describe('CONFIG', () => {
  it('has all required sections', () => {
    expect(CONFIG.canvas).toBeDefined();
    expect(CONFIG.camera).toBeDefined();
    expect(CONFIG.map).toBeDefined();
    expect(CONFIG.player).toBeDefined();
    expect(CONFIG.combat).toBeDefined();
    expect(CONFIG.leveling).toBeDefined();
    expect(CONFIG.waves).toBeDefined();
    expect(CONFIG.collision).toBeDefined();
    expect(CONFIG.particles).toBeDefined();
    expect(CONFIG.ui).toBeDefined();
  });

  it('has valid player config', () => {
    expect(CONFIG.player.radius).toBeGreaterThan(0);
    expect(CONFIG.player.speed).toBeGreaterThan(0);
    expect(CONFIG.player.maxHp).toBeGreaterThan(0);
  });

  it('has valid wave config', () => {
    expect(CONFIG.waves.spawnInterval).toBeGreaterThan(0);
    expect(CONFIG.waves.minSpawnInterval).toBeGreaterThan(0);
    expect(CONFIG.waves.minSpawnInterval).toBeLessThan(CONFIG.waves.spawnInterval);
    expect(CONFIG.waves.maxEnemies).toBeGreaterThan(0);
  });

  it('has valid leveling config', () => {
    expect(CONFIG.leveling.baseExpToLevel).toBeGreaterThan(0);
    expect(CONFIG.leveling.expGrowthFactor).toBeGreaterThan(1);
    expect(CONFIG.leveling.choiceCount).toBeGreaterThanOrEqual(2);
  });

  it('map dimensions are positive', () => {
    expect(CONFIG.map.width).toBeGreaterThan(0);
    expect(CONFIG.map.height).toBeGreaterThan(0);
  });
});
