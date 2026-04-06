import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config.js';

describe('CONFIG', () => {
  it('has all required sections', () => {
    expect(CONFIG.canvas).toBeDefined();
    expect(CONFIG.room).toBeDefined();
    expect(CONFIG.player).toBeDefined();
    expect(CONFIG.combat).toBeDefined();
    expect(CONFIG.leveling).toBeDefined();
    expect(CONFIG.collision).toBeDefined();
    expect(CONFIG.particles).toBeDefined();
    expect(CONFIG.ui).toBeDefined();
    expect(CONFIG.map).toBeDefined();
    expect(CONFIG.camera).toBeDefined();
    expect(CONFIG.waves).toBeDefined();
  });

  it('has valid player config', () => {
    expect(CONFIG.player.radius).toBeGreaterThan(0);
    expect(CONFIG.player.speed).toBeGreaterThan(0);
    expect(CONFIG.player.maxHp).toBeGreaterThan(0);
  });

  it('has valid room config', () => {
    expect(CONFIG.room.wallThickness).toBeGreaterThan(0);
    expect(CONFIG.room.doorWidth).toBeGreaterThan(0);
    expect(CONFIG.room.doorHeight).toBeGreaterThan(0);
    expect(CONFIG.room.playerStartYFraction).toBeGreaterThan(0);
    expect(CONFIG.room.playerStartYFraction).toBeLessThan(1);
  });

  it('has valid leveling config', () => {
    expect(CONFIG.leveling.baseExpToLevel).toBeGreaterThan(0);
    expect(CONFIG.leveling.expGrowthFactor).toBeGreaterThan(1);
    expect(CONFIG.leveling.choiceCount).toBeGreaterThanOrEqual(2);
  });

  it('has valid map config (survivor mode)', () => {
    expect(CONFIG.map.width).toBeGreaterThan(0);
    expect(CONFIG.map.height).toBeGreaterThan(0);
    expect(CONFIG.map.gridSize).toBeGreaterThan(0);
  });

  it('has valid waves config (survivor mode)', () => {
    expect(CONFIG.waves.spawnInterval).toBeGreaterThan(0);
    expect(CONFIG.waves.maxEnemies).toBeGreaterThan(0);
    expect(CONFIG.waves.victoryKills).toBeGreaterThan(0);
  });

  it('has valid camera config (survivor mode)', () => {
    expect(CONFIG.camera.lerp).toBeGreaterThan(0);
    expect(CONFIG.camera.lerp).toBeLessThan(1);
  });
});
