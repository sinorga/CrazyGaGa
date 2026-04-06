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
  // --- ARCHERO WEAPON MODIFIER SKILLS (pool: 'archero') ---
  {
    id: 'skill_diagonal',
    name: '斜角射擊',
    description: '每次射擊額外發射2支斜向箭矢（±45°）',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '↗️',
    maxLevel: 1,
  },
  {
    id: 'skill_side_arrow',
    name: '側翼箭矢',
    description: '向左右各發射一支垂直箭矢',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '↔️',
    maxLevel: 1,
  },
  {
    id: 'skill_back_arrow',
    name: '背後箭矢',
    description: '向反方向發射一支箭矢',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '↩️',
    maxLevel: 1,
  },
  {
    id: 'skill_multishot',
    name: '多重射擊',
    description: '扇形發射3支箭矢（30°展開）',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '🏹',
    maxLevel: 1,
  },
  {
    id: 'skill_bounce',
    name: '彈射箭矢',
    description: '箭矢可反彈牆壁2次',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '🔄',
    maxLevel: 1,
  },
  {
    id: 'skill_ricochet',
    name: '追蹤彈射',
    description: '箭矢碰牆後轉向最近敵人',
    category: 'weapon_modifier',
    pool: 'archero',
    icon: '🎯',
    maxLevel: 1,
  },

  // --- ARCHERO PASSIVE SKILLS (pool: 'archero') ---
  {
    id: 'skill_freeze',
    name: '冰凍術',
    description: '15% 機率擊中時冰凍敵人1.2秒',
    category: 'passive',
    pool: 'archero',
    icon: '❄️',
    maxLevel: 1,
    stat: 'freezeChance',
    value: 0.15,
    valueType: 'flat',
  },
  {
    id: 'skill_poison',
    name: '毒霧',
    description: '擊中時施加每秒3傷害毒效果（持續3秒）',
    category: 'passive',
    pool: 'archero',
    icon: '☠️',
    maxLevel: 1,
    stat: 'poisonDps',
    value: 3,
    valueType: 'flat',
  },
  {
    id: 'skill_heal_on_kill',
    name: '嗜血',
    description: '每次擊殺回復2 HP',
    category: 'passive',
    pool: 'archero',
    icon: '💉',
    maxLevel: 3,
    stat: 'healOnKill',
    value: 2,
    valueType: 'flat',
  },
  {
    id: 'skill_thorns',
    name: '荊棘護甲',
    description: '反彈接觸傷害的15%回給攻擊者',
    category: 'passive',
    pool: 'archero',
    icon: '🌵',
    maxLevel: 1,
    stat: 'thorns',
    value: 0.15,
    valueType: 'flat',
  },
  {
    id: 'skill_vampire',
    name: '吸血',
    description: '造成傷害的8%轉化為生命值',
    category: 'passive',
    pool: 'archero',
    icon: '🧛',
    maxLevel: 3,
    stat: 'vampire',
    value: 0.08,
    valueType: 'flat',
  },

  // --- ARCHERO UNLIMITED FALLBACK SKILLS (always available, no max level) ---
  {
    id: 'skill_heal_potion',
    name: '治癒藥水',
    description: '立即回復40 HP（可重複選取）',
    category: 'passive',
    pool: 'archero',
    icon: '🧪',
    maxLevel: 999,
    stat: 'hp',
    value: 40,
    valueType: 'flat',
  },
  {
    id: 'skill_max_hp_up',
    name: '強化生命',
    description: '最大HP+20（可重複選取）',
    category: 'passive',
    pool: 'archero',
    icon: '❤️',
    maxLevel: 999,
    stat: 'maxHp',
    value: 20,
    valueType: 'flat',
  },

  // --- WEAPON SKILLS (pool: 'levelup') ---
  {
    id: 'skill_arrow',
    name: '弓箭精通',
    description: '獲得/強化弓箭，增加傷害與穿透',
    category: 'weapon',
    pool: 'levelup',
    icon: '🏹',
    maxLevel: 5,
    weaponId: 'arrow',
  },
  {
    id: 'skill_magic_orb',
    name: '魔法球',
    description: '獲得/強化環繞魔法球',
    category: 'weapon',
    pool: 'levelup',
    icon: '🔮',
    maxLevel: 5,
    weaponId: 'magic_orb',
  },
  {
    id: 'skill_lightning',
    name: '閃電之力',
    description: '獲得/強化閃電鏈攻擊',
    category: 'weapon',
    pool: 'levelup',
    icon: '⚡',
    maxLevel: 5,
    weaponId: 'lightning',
  },
  {
    id: 'skill_fire_circle',
    name: '烈焰領域',
    description: '獲得/強化灼燒地面區域',
    category: 'weapon',
    pool: 'levelup',
    icon: '🔥',
    maxLevel: 5,
    weaponId: 'fire_circle',
  },
  {
    id: 'skill_boomerang',
    name: '迴旋鏢',
    description: '獲得/強化迴旋鏢攻擊',
    category: 'weapon',
    pool: 'levelup',
    icon: '🪃',
    maxLevel: 5,
    weaponId: 'boomerang',
  },
  {
    id: 'skill_holy_sword',
    name: '聖劍天降',
    description: '獲得/強化聖劍雨攻擊',
    category: 'weapon',
    pool: 'levelup',
    icon: '⚔️',
    maxLevel: 5,
    weaponId: 'holy_sword',
  },

  // --- PASSIVE SKILLS (pool: 'levelup') ---
  {
    id: 'passive_max_hp',
    name: '生命強化',
    description: '最大生命值 +20',
    category: 'passive',
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
    pool: 'levelup',
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
// pool: 'levelup' | 'archero' | undefined (all)
export function getRandomSkillChoices(count, playerSkillLevels, pool) {
  const available = SKILL_DEFINITIONS.filter(s => {
    const currentLevel = playerSkillLevels[s.id] || 0;
    if (currentLevel >= s.maxLevel) return false;
    if (pool && s.pool !== pool) return false;
    return true;
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
  const bucket = [...weighted];

  for (let i = 0; i < count && bucket.length > 0; i++) {
    const totalWeight = bucket.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    let idx = 0;
    for (idx = 0; idx < bucket.length; idx++) {
      roll -= bucket[idx].weight;
      if (roll <= 0) break;
    }
    choices.push(bucket[idx].skill);
    bucket.splice(idx, 1);
  }

  return choices;
}
