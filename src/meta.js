import { UPGRADE_DEFINITIONS, getUpgradeDefinition } from './data/upgrades.js';
import { CHARACTER_DEFINITIONS, getCharacterDefinition } from './data/characters.js';

const STORAGE_KEY = 'crazygaga_meta';

function defaultMeta() {
  return {
    gold: 0,
    upgrades: {},       // { upgradeId: level }
    unlocked: ['warrior'], // character ids
    selected: 'warrior',
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultMeta();
    // Ensure required fields exist
    return {
      gold: typeof parsed.gold === 'number' ? parsed.gold : 0,
      upgrades: parsed.upgrades || {},
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : ['warrior'],
      selected: parsed.selected || 'warrior',
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // silently fail
  }
}

export function resetMeta() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function purchaseUpgrade(meta, upgradeId) {
  const def = getUpgradeDefinition(upgradeId);
  if (!def) return false;
  const level = meta.upgrades[upgradeId] || 0;
  if (level >= def.maxLevel) return false;
  const cost = def.costs[level];
  if (meta.gold < cost) return false;
  meta.gold -= cost;
  meta.upgrades[upgradeId] = level + 1;
  saveMeta(meta);
  return true;
}

export function unlockCharacter(meta, characterId) {
  const def = getCharacterDefinition(characterId);
  if (!def) return false;
  if (meta.unlocked.includes(characterId)) return false;
  if (meta.gold < def.unlockCost) return false;
  meta.gold -= def.unlockCost;
  meta.unlocked.push(characterId);
  saveMeta(meta);
  return true;
}

export function selectCharacter(meta, characterId) {
  if (!meta.unlocked.includes(characterId)) return false;
  meta.selected = characterId;
  saveMeta(meta);
  return true;
}

export function getUpgradeBonus(meta, stat) {
  let flatBonus = 0;
  let percentBonus = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.stat !== stat) continue;
    const level = meta.upgrades[def.id] || 0;
    for (let i = 0; i < level; i++) {
      if (def.type === 'flat') {
        flatBonus += def.values[i];
      } else if (def.type === 'percent') {
        percentBonus += def.values[i];
      }
    }
  }
  return { flat: flatBonus, percent: percentBonus };
}
