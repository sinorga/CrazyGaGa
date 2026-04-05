import { getConfig, getSpawnableEnemies } from './gameConfig.js';
import { Enemy } from './enemy.js';

export class WaveSpawner {
  constructor() {
    this.elapsed = 0;
    const cfg = getConfig();
    this.spawnTimer = cfg.waves.initialDelay;
    this.spawnInterval = cfg.waves.spawnInterval;
    this.waveCount = 0;
  }

  getHpMultiplier(elapsedSeconds) {
    const minutes = elapsedSeconds / 60;
    return 1 + minutes * getConfig().difficulty.hpMultiplierPerMinute;
  }

  getDamageMultiplier(elapsedSeconds) {
    const minutes = elapsedSeconds / 60;
    return 1 + minutes * getConfig().difficulty.damageMultiplierPerMinute;
  }

  update(dt, playerPos, currentEnemyCount) {
    const cfg = getConfig();
    this.elapsed += dt;
    this.spawnTimer -= dt;

    if (this.spawnTimer > 0) return [];
    if (currentEnemyCount >= cfg.waves.maxEnemies) {
      this.spawnTimer = 0.5; // retry soon
      return [];
    }

    // Spawn a wave
    this.waveCount++;
    const count = Math.floor(cfg.waves.enemiesPerWave + this.waveCount * cfg.waves.enemiesPerWaveGrowth);
    const available = getSpawnableEnemies(this.elapsed);

    if (available.length === 0) {
      this.spawnTimer = this.spawnInterval;
      return [];
    }

    const spawned = [];
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
    const hpMult = this.getHpMultiplier(this.elapsed);
    const dmgMult = this.getDamageMultiplier(this.elapsed);

    for (let i = 0; i < count; i++) {
      if (currentEnemyCount + spawned.length >= cfg.waves.maxEnemies) break;

      // Weighted random selection
      let roll = Math.random() * totalWeight;
      let selected = available[0];
      for (const type of available) {
        roll -= type.weight;
        if (roll <= 0) { selected = type; break; }
      }

      // Spawn at random distance/angle from player
      const angle = Math.random() * Math.PI * 2;
      const dist = cfg.waves.spawnDistanceMin +
        Math.random() * (cfg.waves.spawnDistanceMax - cfg.waves.spawnDistanceMin);
      const sx = playerPos.x + Math.cos(angle) * dist;
      const sy = playerPos.y + Math.sin(angle) * dist;

      // Clamp to map
      const x = Math.max(0, Math.min(cfg.map.width, sx));
      const y = Math.max(0, Math.min(cfg.map.height, sy));

      const enemy = new Enemy(x, y, selected);
      // Apply difficulty scaling
      enemy.hp = Math.round(enemy.hp * hpMult);
      enemy.maxHp = enemy.hp;
      enemy.damage = Math.round(enemy.damage * dmgMult);
      spawned.push(enemy);
    }

    // Decay spawn interval
    this.spawnInterval = Math.max(
      cfg.waves.minSpawnInterval,
      this.spawnInterval * cfg.waves.spawnIntervalDecay
    );
    this.spawnTimer = this.spawnInterval;

    return spawned;
  }

  reset() {
    const cfg = getConfig();
    this.elapsed = 0;
    this.spawnTimer = cfg.waves.initialDelay;
    this.spawnInterval = cfg.waves.spawnInterval;
    this.waveCount = 0;
  }
}
