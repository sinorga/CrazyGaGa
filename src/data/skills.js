// Skill/passive definitions - add new skills here to extend the game
// Skills are passive upgrades chosen on level-up
//
// Categories:
//   'weapon'  - grants or upgrades a weapon
//   'passive' - permanent stat boost
//
// Properties:
//   id          - unique string identifier
//   name        - display name
//   description - shown in level-up UI
//   category    - 'weapon' | 'passive'
//   icon        - emoji for UI
//   maxLevel    - max times this skill can be picked
//   weaponId    - (weapon category) which weapon to grant/upgrade
//   stat        - (passive category) which stat to modify
//   value       - (passive category) amount per level
//   valueType   - 'flat' (add) | 'percent' (multiply)

export const SKILL_DEFINITIONS = [
  // --- WEAPON SKILLS ---
  {
    id: 'skill_arrow',
    name: '弓箭精通',
    description: '獲得/強化弓箭，增加傷害與穿透',
    category: 'weapon',
    icon: '🏹',
    maxLevel: 8,
    weaponId: 'arrow',
  },
  {
    id: 'skill_magic_orb',
    name: '魔法球',
    description: '獲得/強化環繞魔法球',
    category: 'weapon',
    icon: '🔮',
    maxLevel: 8,
    weaponId: 'magic_orb',
  },
  {
    id: 'skill_lightning',
    name: '閃電之力',
    description: '獲得/強化閃電鏈攻擊',
    category: 'weapon',
    icon: '⚡',
    maxLevel: 8,
    weaponId: 'lightning',
  },
  {
    id: 'skill_fire_circle',
    name: '烈焰領域',
    description: '獲得/強化灼燒地面區域',
    category: 'weapon',
    icon: '🔥',
    maxLevel: 8,
    weaponId: 'fire_circle',
  },
  {
    id: 'skill_boomerang',
    name: '迴旋鏢',
    description: '獲得/強化迴旋鏢攻擊',
    category: 'weapon',
    icon: '🪃',
    maxLevel: 8,
    weaponId: 'boomerang',
  },
  {
    id: 'skill_holy_sword',
    name: '聖劍天降',
    description: '獲得/強化聖劍雨攻擊',
    category: 'weapon',
    icon: '⚔️',
    maxLevel: 8,
    weaponId: 'holy_sword',
  },

  // --- PASSIVE SKILLS ---
  {
    id: 'passive_max_hp',
    name: '生命強化',
    description: '最大生命值 +20',
    category: 'passive',
    icon: '❤️',
    maxLevel: 5,
    stat: 'maxHp',
    value: 20,
    valueType: 'flat',
  },
  {
    id: 'passive_speed',
    name: '疾風步',
    description: '移動速度 +10%',
    category: 'passive',
    icon: '💨',
    maxLevel: 5,
    stat: 'speed',
    value: 0.10,
    valueType: 'percent',
  },
  {
    id: 'passive_damage',
    name: '力量提升',
    description: '全傷害 +12%',
    category: 'passive',
    icon: '💪',
    maxLevel: 5,
    stat: 'damage',
    value: 0.12,
    valueType: 'percent',
  },
  {
    id: 'passive_cooldown',
    name: '快速施法',
    description: '攻擊冷卻 -8%',
    category: 'passive',
    icon: '⏱️',
    maxLevel: 5,
    stat: 'cooldown',
    value: -0.08,
    valueType: 'percent',
  },
  {
    id: 'passive_armor',
    name: '鐵壁',
    description: '受到傷害 -3',
    category: 'passive',
    icon: '🛡️',
    maxLevel: 5,
    stat: 'armor',
    value: 3,
    valueType: 'flat',
  },
  {
    id: 'passive_regen',
    name: '生命恢復',
    description: '每秒恢復 1 HP',
    category: 'passive',
    icon: '💚',
    maxLevel: 3,
    stat: 'regen',
    value: 1,
    valueType: 'flat',
  },
  {
    id: 'passive_pickup_range',
    name: '磁鐵',
    description: '拾取範圍 +30%',
    category: 'passive',
    icon: '🧲',
    maxLevel: 3,
    stat: 'pickupRange',
    value: 0.30,
    valueType: 'percent',
  },
  {
    id: 'passive_exp_bonus',
    name: '經驗加成',
    description: '經驗獲取 +15%',
    category: 'passive',
    icon: '📖',
    maxLevel: 3,
    stat: 'expBonus',
    value: 0.15,
    valueType: 'percent',
  },
];

// Helper: get skill by id
export function getSkillDefinition(id) {
  return SKILL_DEFINITIONS.find(s => s.id === id);
}

// Helper: get random skill choices for level-up, excluding maxed skills
export function getRandomSkillChoices(count, playerSkillLevels) {
  const available = SKILL_DEFINITIONS.filter(s => {
    const currentLevel = playerSkillLevels[s.id] || 0;
    return currentLevel < s.maxLevel;
  });

  // Weighted shuffle - weapon skills player already has are more likely
  const weighted = available.map(s => {
    let weight = 1;
    if (s.category === 'weapon' && (playerSkillLevels[s.id] || 0) > 0) {
      weight = 2; // existing weapons are more likely to appear for upgrade
    }
    return { skill: s, weight };
  });

  const choices = [];
  const pool = [...weighted];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    let idx = 0;
    for (idx = 0; idx < pool.length; idx++) {
      roll -= pool[idx].weight;
      if (roll <= 0) break;
    }
    choices.push(pool[idx].skill);
    pool.splice(idx, 1);
  }

  return choices;
}
