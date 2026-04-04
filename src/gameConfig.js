// gameConfig.js — unified runtime config layer
// Merges static defaults with localStorage overrides.
// All consumers should import from here for overridable data.

import { CONFIG } from './config.js';
import { ENEMY_TYPES } from './data/enemies.js';
import { WEAPON_DEFINITIONS } from './data/weapons.js';
import { SKILL_DEFINITIONS } from './data/skills.js';
import { CHARACTER_DEFINITIONS } from './data/characters.js';
import { UPGRADE_DEFINITIONS } from './data/upgrades.js';
import { EVOLUTION_RECIPES } from './data/evolutions.js';

export const OVERRIDE_KEY = 'crazygaga_config_override';

// Store original defaults for reset / delta computation
const CONFIG_DEFAULTS = deepClone(CONFIG);

// Deep clone an object/array (JSON round-trip, works for plain data)
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Deep merge: source fields override target fields recursively.
// Arrays are replaced wholesale (not recursively merged).
function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) return source;
  if (typeof target !== 'object' || target === null) return deepClone(source);
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
      typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Set a value at a dot-path on an object (mutates in place)
function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// Compute delta: only fields in 'updated' that differ from 'original'
function computeDelta(original, updated) {
  const delta = {};
  for (const key of Object.keys(updated)) {
    if (!(key in original)) continue;
    const origVal = original[key];
    const updVal = updated[key];
    if (
      typeof origVal === 'object' && origVal !== null && !Array.isArray(origVal) &&
      typeof updVal === 'object' && updVal !== null && !Array.isArray(updVal)
    ) {
      const sub = computeDelta(origVal, updVal);
      if (Object.keys(sub).length > 0) delta[key] = sub;
    } else if (JSON.stringify(origVal) !== JSON.stringify(updVal)) {
      delta[key] = updVal;
    }
  }
  return delta;
}

// ─── Cached merged data ───────────────────────────────────────────────────────

let _config = null;
let _enemies = null;
let _weapons = null;
let _skills = null;
let _characters = null;
let _upgrades = null;

function _loadRaw() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function _saveRaw(overrides) {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {}
}

export function reloadCache() {
  const ov = _loadRaw();

  // Config: merge onto defaults, then propagate to live CONFIG object
  // so consumers that import CONFIG directly also see overrides.
  _config = deepMerge(CONFIG_DEFAULTS, ov.config || {});
  for (const section of Object.keys(CONFIG_DEFAULTS)) {
    if (typeof CONFIG_DEFAULTS[section] === 'object' && !Array.isArray(CONFIG_DEFAULTS[section])) {
      Object.assign(CONFIG[section], _config[section]);
    } else {
      CONFIG[section] = _config[section];
    }
  }

  // Entity arrays: merge by id
  _enemies = ENEMY_TYPES.map(e => {
    const o = ov.enemies?.[e.id];
    return o ? deepMerge(e, o) : { ...e };
  });

  _weapons = WEAPON_DEFINITIONS.map(w => {
    const o = ov.weapons?.[w.id];
    return o ? deepMerge(w, o) : { ...w };
  });

  _skills = SKILL_DEFINITIONS.map(s => {
    const o = ov.skills?.[s.id];
    return o ? deepMerge(s, o) : { ...s };
  });

  _characters = CHARACTER_DEFINITIONS.map(c => {
    const o = ov.characters?.[c.id];
    return o ? deepMerge(c, o) : { ...c };
  });

  _upgrades = UPGRADE_DEFINITIONS.map(u => {
    const o = ov.upgrades?.[u.id];
    return o ? deepMerge(u, o) : { ...u };
  });
}

// Initialize on module load
reloadCache();

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getConfig() { return _config; }
export function getEnemyTypes() { return _enemies; }
export function getWeaponDefs() { return _weapons; }
export function getSkillDefs() { return _skills; }
export function getCharacterDefs() { return _characters; }
export function getUpgradeDefs() { return _upgrades; }
export function getEvolutionRecipes() { return EVOLUTION_RECIPES; }

// Convenience finders (drop-in replacements for data/helpers)
export function getEnemyType(id) { return _enemies.find(e => e.id === id) || null; }
export function getBossForPhase(phase) { return _enemies.find(e => e.type === 'boss' && e.bossPhase === phase) || null; }
export function getSpawnableEnemies(elapsed) { return _enemies.filter(e => e.weight > 0 && e.unlockTime <= elapsed); }
export function getWeaponDef(id) { const d = _weapons.find(w => w.id === id); return d ? deepClone(d) : null; }
export function getSkillDef(id) { return _skills.find(s => s.id === id) || null; }
export function getCharacterDef(id) { return _characters.find(c => c.id === id) || null; }
export function getUpgradeDef(id) { return _upgrades.find(u => u.id === id) || null; }

// Random skill choices (mirrors data/skills.js getRandomSkillChoices)
export function getRandomSkillChoices(count, playerSkillLevels) {
  const available = _skills.filter(s => {
    const cur = playerSkillLevels[s.id] || 0;
    return cur < s.maxLevel;
  });
  const weighted = available.map(s => {
    let w = 1;
    if (s.category === 'weapon' && (playerSkillLevels[s.id] || 0) > 0) w = 2;
    return { skill: s, w };
  });
  const choices = [];
  const pool = [...weighted];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    let idx = 0;
    for (idx = 0; idx < pool.length; idx++) {
      roll -= pool[idx].w;
      if (roll <= 0) break;
    }
    choices.push(pool[idx].skill);
    pool.splice(idx, 1);
  }
  return choices;
}

// ─── Mutation API ─────────────────────────────────────────────────────────────

// section: 'config' | 'enemies' | 'weapons' | 'skills' | 'characters' | 'upgrades'
// id: entity id (null for 'config')
// path: dot-path to field, e.g. 'hp' or 'behavior.fireRate' or 'player.maxHp'
export function setOverride(section, id, path, value) {
  const ov = _loadRaw();
  if (!ov[section]) ov[section] = {};
  if (id) {
    if (!ov[section][id]) ov[section][id] = {};
    setByPath(ov[section][id], path, value);
  } else {
    setByPath(ov[section], path, value);
  }
  _saveRaw(ov);
  reloadCache();
}

export function resetAllOverrides() {
  try { localStorage.removeItem(OVERRIDE_KEY); } catch {}
  reloadCache();
}

export function exportJSON() {
  return JSON.stringify({
    config: _config,
    enemies: Object.fromEntries(_enemies.map(e => [e.id, e])),
    weapons: Object.fromEntries(_weapons.map(w => [w.id, w])),
    skills: Object.fromEntries(_skills.map(s => [s.id, s])),
    characters: Object.fromEntries(_characters.map(c => [c.id, c])),
    upgrades: Object.fromEntries(_upgrades.map(u => [u.id, u])),
  }, null, 2);
}

export function importJSON(str) {
  const parsed = JSON.parse(str); // throws on invalid JSON
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid config JSON');

  const ov = {};

  if (parsed.config && typeof parsed.config === 'object') {
    const delta = computeDelta(CONFIG_DEFAULTS, parsed.config);
    if (Object.keys(delta).length > 0) ov.config = delta;
  }

  const entitySections = [
    ['enemies', ENEMY_TYPES],
    ['weapons', WEAPON_DEFINITIONS],
    ['skills', SKILL_DEFINITIONS],
    ['characters', CHARACTER_DEFINITIONS],
    ['upgrades', UPGRADE_DEFINITIONS],
  ];
  for (const [section, defaults] of entitySections) {
    if (!parsed[section] || typeof parsed[section] !== 'object') continue;
    const secDelta = {};
    for (const def of defaults) {
      const imp = parsed[section][def.id];
      if (!imp) continue;
      const delta = computeDelta(def, imp);
      if (Object.keys(delta).length > 0) secDelta[def.id] = delta;
    }
    if (Object.keys(secDelta).length > 0) ov[section] = secDelta;
  }

  _saveRaw(ov);
  reloadCache();
}

// Expose static defaults for the config editor to check what's modified
export function getConfigDefaults() { return CONFIG_DEFAULTS; }
export function getEnemyDefaults() { return ENEMY_TYPES; }
export function getWeaponDefaults() { return WEAPON_DEFINITIONS; }
export function getSkillDefaults() { return SKILL_DEFINITIONS; }
export function getCharacterDefaults() { return CHARACTER_DEFINITIONS; }
export function getUpgradeDefaults() { return UPGRADE_DEFINITIONS; }
