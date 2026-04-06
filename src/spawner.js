import { getConfig } from './gameConfig.js';

export class WaveSpawner {
  constructor() {
    this.reset();
  }

  reset() {
    const cfg = getConfig();
    this.timer = cfg.waves.initialDelay;
    this.spawnInterval = cfg.waves.spawnInterval;
    this.enemyCount = cfg.waves.enemiesPerWave;
    this.totalSpawned = 0;
  }

  update(dt, enemies, player, spawnFn) {
    const cfg = getConfig();
    const waves = cfg.waves;
    const map = cfg.map;

    // Don't spawn if at cap
    const alive = enemies.filter(e => e.alive).length;
    if (alive >= waves.maxEnemies) return;

    this.timer -= dt;
    if (this.timer > 0) return;

    // Spawn a wave
    const count = Math.ceil(this.enemyCount);
    for (let i = 0; i < count; i++) {
      if (enemies.filter(e => e.alive).length >= waves.maxEnemies) break;

      const angle = Math.random() * Math.PI * 2;
      const dist = waves.spawnDistanceMin + Math.random() * (waves.spawnDistanceMax - waves.spawnDistanceMin);
      let x = player.x + Math.cos(angle) * dist;
      let y = player.y + Math.sin(angle) * dist;

      // Clamp to map bounds with a small margin
      const margin = 20;
      x = Math.max(margin, Math.min(map.width - margin, x));
      y = Math.max(margin, Math.min(map.height - margin, y));

      const typeId = this._pickEnemyType();
      spawnFn(typeId, x, y);
      this.totalSpawned++;
    }

    // Decay interval (gets harder over time)
    this.spawnInterval = Math.max(
      waves.minSpawnInterval,
      this.spawnInterval * waves.spawnIntervalDecay
    );
    this.enemyCount += waves.enemiesPerWaveGrowth;
    this.timer = this.spawnInterval;
  }

  _pickEnemyType() {
    const pool = ['slime', 'slime', 'slime', 'fast_bat', 'fast_bat', 'tank_troll', 'shooter_goblin'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
