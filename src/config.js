// Game configuration - all tunable values in one place
export const VERSION = '2.0.0';

export const CONFIG = {
  // Display
  canvas: {
    backgroundColor: '#1a1a2e',
  },

  // Room arena
  room: {
    wallThickness: 20,
    wallColor: '#334455',
    floorColor: '#1a1a2e',
    doorWidth: 80,
    doorHeight: 60,
    doorColor: '#ffdd44',
    playerStartYFraction: 0.8,
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
    fireWhileMoving: false, // allow firing while moving (Archero-style: false = stop to shoot)
    wallBounces: 0, // base number of wall bounces for projectiles
  },

  // Experience & Leveling
  leveling: {
    baseExpToLevel: 10,
    expGrowthFactor: 1.15, // each level needs 15% more EXP
    choiceCount: 3, // number of skill choices per level up
    gemBaseValue: 1,
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
