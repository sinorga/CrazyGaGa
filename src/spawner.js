import { CONFIG } from './config.js';
import { Enemy } from './enemy.js';
import { getSpawnableEnemies } from './data/enemies.js';

export class WaveSpawner {
  constructor() {
    this.elapsed = 0;
    this.spawnTimer = CONFIG.waves.initialDelay;
    this.spawnInterval = CONFIG.waves.spawnInterval;
    this.waveCount = 0;
  }

  update(dt, playerPos, currentEnemyCount) {
    this.elapsed += dt;
    this.spawnTimer -= dt;

    if (this.spawnTimer > 0) return [];
    if (currentEnemyCount >= CONFIG.waves.maxEnemies) {
      this.spawnTimer = 0.5; // retry soon
      return [];
    }

    // Spawn a wave
    this.waveCount++;
    const count = Math.floor(CONFIG.waves.enemiesPerWave + this.waveCount * CONFIG.waves.enemiesPerWaveGrowth);
    const available = getSpawnableEnemies(this.elapsed);

    if (available.length === 0) {
      this.spawnTimer = this.spawnInterval;
      return [];
    }

    const spawned = [];
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);

    for (let i = 0; i < count; i++) {
      if (currentEnemyCount + spawned.length >= CONFIG.waves.maxEnemies) break;

      // Weighted random selection
      let roll = Math.random() * totalWeight;
      let selected = available[0];
      for (const type of available) {
        roll -= type.weight;
        if (roll <= 0) { selected = type; break; }
      }

      // Spawn at random distance/angle from player
      const angle = Math.random() * Math.PI * 2;
      const dist = CONFIG.waves.spawnDistanceMin +
        Math.random() * (CONFIG.waves.spawnDistanceMax - CONFIG.waves.spawnDistanceMin);
      const sx = playerPos.x + Math.cos(angle) * dist;
      const sy = playerPos.y + Math.sin(angle) * dist;

      // Clamp to map
      const x = Math.max(0, Math.min(CONFIG.map.width, sx));
      const y = Math.max(0, Math.min(CONFIG.map.height, sy));

      spawned.push(new Enemy(x, y, selected));
    }

    // Decay spawn interval
    this.spawnInterval = Math.max(
      CONFIG.waves.minSpawnInterval,
      this.spawnInterval * CONFIG.waves.spawnIntervalDecay
    );
    this.spawnTimer = this.spawnInterval;

    return spawned;
  }

  reset() {
    this.elapsed = 0;
    this.spawnTimer = CONFIG.waves.initialDelay;
    this.spawnInterval = CONFIG.waves.spawnInterval;
    this.waveCount = 0;
  }
}
