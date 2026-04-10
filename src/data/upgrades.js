// Permanent upgrade definitions — purchasable with gold between runs
//
// Properties:
//   id       - unique identifier
//   name     - display name (繁體中文)
//   description - short description
//   stat     - which stat this upgrades
//   type     - 'flat' (additive) or 'percent' (multiplicative bonus)
//   maxLevel - maximum purchasable level
//   costs    - array of gold cost per level [level1, level2, ...]
//   values   - array of bonus per level [level1, level2, ...]

export const UPGRADE_DEFINITIONS = [
  {
    id: 'hp_boost',
    name: '生命強化',
    description: '提升初始血量上限',
    stat: 'maxHp',
    type: 'flat',
    maxLevel: 5,
    costs: [100, 200, 400, 800, 1600],
    values: [50, 50, 50, 50, 50],
  },
  {
    id: 'damage_boost',
    name: '攻擊強化',
    description: '提升基礎傷害',
    stat: 'damage',
    type: 'percent',
    maxLevel: 5,
    costs: [100, 200, 400, 800, 1600],
    values: [0.1, 0.1, 0.1, 0.1, 0.1],
  },
  {
    id: 'speed_boost',
    name: '速度強化',
    description: '提升移動速度',
    stat: 'speed',
    type: 'flat',
    maxLevel: 5,
    costs: [80, 160, 320, 640, 1280],
    values: [15, 15, 15, 15, 15],
  },
  {
    id: 'armor_boost',
    name: '護甲強化',
    description: '提升基礎護甲',
    stat: 'armor',
    type: 'flat',
    maxLevel: 5,
    costs: [120, 240, 480, 960, 1920],
    values: [2, 2, 2, 2, 2],
  },
  {
    id: 'gold_boost',
    name: '金幣加成',
    description: '提升金幣獲取量',
    stat: 'goldRate',
    type: 'percent',
    maxLevel: 5,
    costs: [150, 300, 600, 1200, 2400],
    values: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    id: 'exp_boost',
    name: '經驗加成',
    description: '提升經驗獲取量',
    stat: 'expBonus',
    type: 'percent',
    maxLevel: 5,
    costs: [150, 300, 600, 1200, 2400],
    values: [0.1, 0.1, 0.1, 0.1, 0.1],
  },
];

export function getUpgradeDefinition(id) {
  return UPGRADE_DEFINITIONS.find(u => u.id === id) || null;
}
