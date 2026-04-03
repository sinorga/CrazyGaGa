// Weapon definitions - add new weapons here to extend the game
// Weapons are the active attack methods the player uses
//
// Properties:
//   id           - unique string identifier
//   name         - display name
//   description  - short description for UI
//   type         - attack pattern: 'projectile' | 'orbit' | 'area' | 'chain' | 'boomerang'
//   damage       - base damage per hit
//   cooldown     - seconds between attacks
//   color        - projectile/effect color
//   level        - current upgrade level (starts at 1)
//   maxLevel     - maximum upgrade level
//   icon         - emoji icon for UI
//   levelScaling - stats multiplied per level
//   config       - type-specific configuration

export const WEAPON_DEFINITIONS = [
  {
    id: 'arrow',
    name: '弓箭',
    description: '直射箭矢，可穿透敵人',
    type: 'projectile',
    damage: 10,
    cooldown: 0.8,
    color: '#ffdd44',
    maxLevel: 8,
    icon: '🏹',
    levelScaling: { damage: 1.2, cooldown: 0.95 },
    config: {
      speed: 350,
      radius: 5,
      pierce: 1, // number of enemies it can pass through
      count: 1, // projectiles per shot
      spread: 0, // spread angle in radians
    },
  },
  {
    id: 'magic_orb',
    name: '魔法球',
    description: '環繞角色旋轉的魔法球',
    type: 'orbit',
    damage: 8,
    cooldown: 0, // continuous damage on contact
    color: '#66aaff',
    maxLevel: 8,
    icon: '🔮',
    levelScaling: { damage: 1.2 },
    config: {
      orbitRadius: 70,
      orbitSpeed: 2.5, // radians per second
      count: 2, // number of orbs
      radius: 8,
      hitCooldown: 0.5, // seconds between hitting same enemy
    },
  },
  {
    id: 'lightning',
    name: '閃電鏈',
    description: '隨機電擊附近敵人，可連鎖',
    type: 'chain',
    damage: 15,
    cooldown: 1.5,
    color: '#ffff44',
    maxLevel: 8,
    icon: '⚡',
    levelScaling: { damage: 1.25, cooldown: 0.92 },
    config: {
      range: 200, // max range to first target
      chainRange: 120, // max range between chain targets
      chainCount: 2, // number of chain bounces
      duration: 0.15, // visual duration of lightning
    },
  },
  {
    id: 'fire_circle',
    name: '火圈',
    description: '在地面產生灼燒區域',
    type: 'area',
    damage: 6,
    cooldown: 3.0,
    color: '#ff6622',
    maxLevel: 8,
    icon: '🔥',
    levelScaling: { damage: 1.2, cooldown: 0.93 },
    config: {
      radius: 50,
      duration: 3.0, // how long the area lasts
      tickRate: 0.5, // damage tick interval
    },
  },
  {
    id: 'boomerang',
    name: '迴旋鏢',
    description: '投出後返回，來回皆造成傷害',
    type: 'boomerang',
    damage: 12,
    cooldown: 1.2,
    color: '#ff88cc',
    maxLevel: 8,
    icon: '🪃',
    levelScaling: { damage: 1.2, cooldown: 0.94 },
    config: {
      speed: 250,
      range: 200, // max travel distance before returning
      radius: 10,
      pierce: 999, // hits everything on path
    },
  },
  {
    id: 'holy_sword',
    name: '聖劍雨',
    description: '從天降下聖劍覆蓋範圍',
    type: 'area',
    damage: 25,
    cooldown: 4.0,
    color: '#ffffaa',
    maxLevel: 8,
    icon: '⚔️',
    levelScaling: { damage: 1.25, cooldown: 0.92 },
    config: {
      radius: 40,
      duration: 0.5,
      tickRate: 0.5,
      count: 3, // number of sword drops
      randomOffset: 120, // random position offset from enemies
    },
  },
];

// Helper: get weapon definition by id (returns a deep copy for instance use)
export function getWeaponDefinition(id) {
  const def = WEAPON_DEFINITIONS.find(w => w.id === id);
  if (!def) return null;
  return JSON.parse(JSON.stringify(def));
}
