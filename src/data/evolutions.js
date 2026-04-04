// Weapon evolution recipes
// Each recipe defines: base weapon + required passive → evolved weapon
//
// Properties:
//   baseWeaponId  - the weapon that evolves
//   requiredPassive - the passive skill needed (by stat name)
//   evolvedWeaponId - the resulting evolved weapon id
//   name          - display name of the evolution
//   description   - description shown to player

export const EVOLUTION_RECIPES = [
  {
    baseWeaponId: 'arrow',
    requiredPassive: 'damage',
    evolvedWeaponId: 'arrow_evolved',
    name: '穿魂箭',
    description: '箭矢穿透一切，造成雙倍傷害',
  },
  {
    baseWeaponId: 'magic_orb',
    requiredPassive: 'speed',
    evolvedWeaponId: 'magic_orb_evolved',
    name: '星辰風暴',
    description: '環繞的魔法球數量增加，範圍擴大',
  },
  {
    baseWeaponId: 'lightning',
    requiredPassive: 'cooldown',
    evolvedWeaponId: 'lightning_evolved',
    name: '雷神之怒',
    description: '閃電鏈數倍增，攻擊範圍大幅提升',
  },
  {
    baseWeaponId: 'fire_circle',
    requiredPassive: 'maxHp',
    evolvedWeaponId: 'fire_circle_evolved',
    name: '煉獄烈焰',
    description: '灼燒區域更大、持續更久',
  },
  {
    baseWeaponId: 'boomerang',
    requiredPassive: 'pickupRange',
    evolvedWeaponId: 'boomerang_evolved',
    name: '風暴迴旋',
    description: '迴旋鏢變大，飛行距離加倍',
  },
  {
    baseWeaponId: 'holy_sword',
    requiredPassive: 'armor',
    evolvedWeaponId: 'holy_sword_evolved',
    name: '神聖制裁',
    description: '聖劍數量加倍，覆蓋範圍更廣',
  },
];

// Helper: find evolution recipe for a weapon
export function getEvolutionRecipe(weaponId) {
  return EVOLUTION_RECIPES.find(r => r.baseWeaponId === weaponId) || null;
}

// Helper: check if player meets evolution requirements
export function canEvolve(weaponId, weaponLevel, playerPassives) {
  const recipe = getEvolutionRecipe(weaponId);
  if (!recipe) return false;
  if (weaponLevel < 8) return false; // must be max level
  return (playerPassives[recipe.requiredPassive] || 0) > 0;
}
