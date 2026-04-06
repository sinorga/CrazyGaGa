// Enemy type definitions - add new types here to extend the game
// Each enemy type defines its behavior, stats, and appearance
//
// Properties:
//   id         - unique string identifier
//   name       - display name
//   type       - behavior type: 'charger' | 'shooter' | 'tank' | 'exploder' | 'summoner' | 'boss'
//   radius     - collision/render radius
//   hp         - base hit points
//   speed      - movement speed (px/sec)
//   damage     - contact damage to player
//   color      - fill color
//   exp        - experience points dropped on death
//   unlockTime - seconds into the run before this type can spawn
//   weight     - spawn weight (higher = more common)
//   behavior   - (optional) extra behavior config
//
// Boss-specific:
//   bossPhase  - which boss phase (1=first boss, 2=second, etc.)
//   attacks    - array of attack pattern definitions

export const ENEMY_TYPES = [
  // --- BASIC ENEMIES ---
  {
    id: 'slime',
    name: '史萊姆',
    icon: '🟢',
    type: 'charger',
    radius: 12,
    hp: 15,
    speed: 60,
    damage: 8,
    color: '#44cc44',
    exp: 1,
    unlockTime: 0,
    weight: 10,
  },
  {
    id: 'fast_bat',
    name: '蝙蝠',
    icon: '🦇',
    type: 'charger',
    radius: 10,
    hp: 8,
    speed: 130,
    damage: 5,
    color: '#aa44dd',
    exp: 1,
    unlockTime: 0,
    weight: 8,
  },
  {
    id: 'skeleton',
    name: '骷髏兵',
    icon: '💀',
    type: 'charger',
    radius: 14,
    hp: 30,
    speed: 50,
    damage: 12,
    color: '#ccccaa',
    exp: 2,
    unlockTime: 30,
    weight: 7,
  },

  // --- SHOOTERS ---
  {
    id: 'mage',
    name: '暗黑法師',
    icon: '🧙',
    type: 'shooter',
    radius: 13,
    hp: 20,
    speed: 40,
    damage: 6,
    color: '#6644cc',
    exp: 3,
    unlockTime: 45,
    weight: 5,
    behavior: {
      projectileSpeed: 150,
      projectileRadius: 5,
      projectileColor: '#aa66ff',
      projectileDamage: 10,
      fireRate: 1.5, // seconds between shots
      preferredDistance: 200, // tries to keep this distance from player
    },
  },
  {
    id: 'archer',
    name: '暗影弓手',
    icon: '🏹',
    type: 'shooter',
    radius: 12,
    hp: 16,
    speed: 55,
    damage: 5,
    color: '#886633',
    exp: 2,
    unlockTime: 60,
    weight: 5,
    behavior: {
      projectileSpeed: 220,
      projectileRadius: 4,
      projectileColor: '#ffcc44',
      projectileDamage: 8,
      fireRate: 1.0,
      preferredDistance: 250,
    },
  },

  // --- TANKS ---
  {
    id: 'golem',
    name: '石魔像',
    icon: '🪨',
    type: 'tank',
    radius: 22,
    hp: 120,
    speed: 25,
    damage: 20,
    color: '#888877',
    exp: 5,
    unlockTime: 90,
    weight: 3,
  },

  // --- EXPLODERS ---
  {
    id: 'bomb_bug',
    name: '炸彈蟲',
    icon: '💣',
    type: 'exploder',
    radius: 11,
    hp: 12,
    speed: 80,
    damage: 5,
    color: '#ff6644',
    exp: 2,
    unlockTime: 60,
    weight: 4,
    behavior: {
      explosionRadius: 60,
      explosionDamage: 25,
      explosionColor: '#ff4400',
    },
  },

  // --- SUMMONERS ---
  {
    id: 'necromancer',
    name: '亡靈巫師',
    icon: '☠️',
    type: 'summoner',
    radius: 15,
    hp: 40,
    speed: 30,
    damage: 5,
    color: '#22aa88',
    exp: 8,
    unlockTime: 120,
    weight: 2,
    behavior: {
      summonId: 'slime', // which enemy to summon
      summonCount: 3,
      summonInterval: 4, // seconds
      preferredDistance: 250,
    },
  },

  // --- NEW ENEMY TYPES ---
  {
    id: 'shielder',
    name: '盾兵',
    icon: '🛡️',
    type: 'shielder',
    radius: 16,
    hp: 60,
    speed: 45,
    damage: 14,
    color: '#4488cc',
    exp: 4,
    unlockTime: 0,
    weight: 0, // spawned via room templates only
    behavior: { shieldArc: 120 }, // degrees of frontal protection
  },
  {
    id: 'healer',
    name: '治療師',
    icon: '💊',
    type: 'healer',
    radius: 13,
    hp: 35,
    speed: 35,
    damage: 5,
    color: '#44cc88',
    exp: 5,
    unlockTime: 0,
    weight: 0,
    behavior: { healRange: 150, healRate: 5 },
  },
  {
    id: 'dasher',
    name: '衝刺者',
    icon: '💨',
    type: 'dasher',
    radius: 12,
    hp: 25,
    speed: 60,
    damage: 18,
    color: '#cc8844',
    exp: 3,
    unlockTime: 0,
    weight: 0,
    behavior: { dashSpeed: 400, dashInterval: 1.5 },
  },

  // --- BOSSES ---
  {
    id: 'boss_demon',
    name: '烈焰惡魔',
    icon: '😈',
    type: 'boss',
    radius: 40,
    hp: 800,
    speed: 80,
    damage: 30,
    color: '#ff2222',
    exp: 200,
    unlockTime: 0, // controlled by bossPhase instead
    weight: 0, // bosses don't spawn randomly
    bossPhase: 1,
    phaseAt: 0.5, // triggers phase 2 at 50% HP
    attacks: [
      { type: 'charge', speed: 200, duration: 1.0, cooldown: 5 },
      { type: 'bullet_ring', count: 12, speed: 120, cooldown: 3 },
    ],
  },
  {
    id: 'boss_lich',
    name: '巫妖王',
    icon: '👾',
    type: 'boss',
    radius: 35,
    hp: 1500,
    speed: 70,
    damage: 25,
    color: '#44ffaa',
    exp: 500,
    unlockTime: 0,
    weight: 0,
    bossPhase: 2,
    phaseAt: 0.5,
    attacks: [
      { type: 'summon', summonId: 'skeleton', count: 6, cooldown: 8 },
      { type: 'bullet_spiral', count: 20, speed: 100, cooldown: 4 },
      { type: 'teleport', cooldown: 6 },
    ],
  },
  {
    id: 'boss_dragon',
    name: '冰龍王',
    icon: '🐉',
    type: 'boss',
    radius: 45,
    hp: 2000,
    speed: 65,
    damage: 35,
    color: '#4488ff',
    exp: 800,
    unlockTime: 0,
    weight: 0,
    bossPhase: 3,
    phaseAt: 0.5,
    attacks: [
      { type: 'fire_breath', damage: 20, coneAngle: 60, range: 200, cooldown: 4 },
      { type: 'wing_gust', knockback: 250, cooldown: 6 },
      { type: 'tail_sweep', damage: 25, radius: 120, cooldown: 5 },
    ],
  },
  {
    id: 'boss_lich_king',
    name: '亡靈巫王',
    icon: '💀',
    type: 'boss',
    radius: 38,
    hp: 2500,
    speed: 55,
    damage: 28,
    color: '#aa44ff',
    exp: 1000,
    unlockTime: 0,
    weight: 0,
    bossPhase: 4,
    phaseAt: 0.5,
    attacks: [
      { type: 'ice_nova', count: 16, speed: 130, cooldown: 5 },
      { type: 'summon', summonId: 'skeleton', count: 8, cooldown: 10 },
      { type: 'teleport', cooldown: 4 },
      { type: 'silence', duration: 2, cooldown: 8 }, // disables player shooting
    ],
  },
];

// Helper: get enemy definition by id
export function getEnemyType(id) {
  return ENEMY_TYPES.find(e => e.id === id);
}

// Helper: get all spawnable enemies at a given time
export function getSpawnableEnemies(elapsedSeconds) {
  return ENEMY_TYPES.filter(e => e.weight > 0 && e.unlockTime <= elapsedSeconds);
}

// Helper: get boss for a given phase
export function getBossForPhase(phase) {
  return ENEMY_TYPES.find(e => e.type === 'boss' && e.bossPhase === phase);
}
