// Game configuration - all tunable values in one place
export const CONFIG = {
  // Display
  canvas: {
    backgroundColor: '#1a1a2e',
  },

  // Camera
  camera: {
    lerp: 0.08, // smooth follow factor
  },

  // Map
  map: {
    width: 3000,
    height: 3000,
    gridSize: 100, // background grid cell size
    gridColor: 'rgba(255,255,255,0.03)',
    borderColor: '#ff4444',
    borderWidth: 4,
  },

  // Player
  player: {
    radius: 16,
    speed: 180, // px/sec
    maxHp: 500,
    color: '#00d4ff',
    invincibleDuration: 0.5, // seconds after being hit
    pickupRange: 60, // auto-pickup radius
    magnetRange: 150, // magnetic pull range for gems
  },

  // Combat
  combat: {
    autoAttackDelay: 0.1, // seconds after stopping before auto-attack starts
  },

  // Experience & Leveling
  leveling: {
    baseExpToLevel: 10,
    expGrowthFactor: 1.15, // each level needs 15% more EXP
    choiceCount: 3, // number of skill choices per level up
    gemBaseValue: 1,
  },

  // Wave spawning
  waves: {
    initialDelay: 1, // seconds before first spawn
    spawnInterval: 2.5, // seconds between spawns (decreases over time)
    minSpawnInterval: 0.5,
    spawnIntervalDecay: 0.99, // multiply interval by this each wave
    enemiesPerWave: 2, // starting count
    enemiesPerWaveGrowth: 0.3, // extra enemies per wave
    maxEnemies: 80, // cap on screen
    spawnDistanceMin: 400, // min distance from player
    spawnDistanceMax: 600,
    bossKillThreshold: 100, // kills needed to trigger boss spawn
    victoryKills: 500, // kills needed to win
  },

  // Spatial hash grid
  collision: {
    cellSize: 64,
  },

  // Particles
  particles: {
    maxCount: 300,
  },

  // UI
  ui: {
    joystickRadius: 60,
    joystickKnobRadius: 25,
    joystickColor: 'rgba(255,255,255,0.15)',
    joystickKnobColor: 'rgba(255,255,255,0.4)',
    hpBarWidth: 200,
    hpBarHeight: 16,
    expBarHeight: 6,
  },

  // Difficulty scaling
  difficulty: {
    hpMultiplierPerMinute: 0.1,      // +10% HP per minute
    damageMultiplierPerMinute: 0.05,  // +5% damage per minute
  },

  // Meta progression (Phase 5 placeholder)
  meta: {
    goldPerKill: 0.2, // average gold per kill
  },
};
