import { CONFIG } from './config.js';

// Settings definitions — drives UI and persistence
export const SETTINGS_DEFS = [
  { key: 'playerMaxHp',        label: '玩家血量',       configPath: 'player.maxHp',                      min: 50,   max: 2000, step: 50,   default: 500  },
  { key: 'playerSpeed',        label: '移動速度',       configPath: 'player.speed',                      min: 50,   max: 500,  step: 10,   default: 180  },
  { key: 'cooldownMultiplier', label: '攻速倍率',       configPath: null,                                min: 0.1,  max: 3.0,  step: 0.1,  default: 1.0  },
  { key: 'spawnInterval',      label: '刷怪間隔',       configPath: 'waves.spawnInterval',                min: 0.5,  max: 5.0,  step: 0.1,  default: 2.5  },
  { key: 'maxEnemies',         label: '最大敵人數',     configPath: 'waves.maxEnemies',                   min: 10,   max: 300,  step: 10,   default: 80   },
  { key: 'bossKillThreshold',  label: 'Boss擊殺門檻',  configPath: 'waves.bossKillThreshold',            min: 20,   max: 500,  step: 10,   default: 100  },
  { key: 'hpScaling',          label: '敵人血量增長',   configPath: 'difficulty.hpMultiplierPerMinute',    min: 0,    max: 0.5,  step: 0.01, default: 0.1  },
  { key: 'dmgScaling',         label: '敵人傷害增長',   configPath: 'difficulty.damageMultiplierPerMinute',min: 0,    max: 0.3,  step: 0.01, default: 0.05 },
];

const STORAGE_KEY = 'crazygaga_settings';

// Deep set a value on an object by dot-path
function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    // Clamp values to valid ranges
    const result = {};
    for (const def of SETTINGS_DEFS) {
      if (def.key in parsed && typeof parsed[def.key] === 'number') {
        result[def.key] = Math.min(def.max, Math.max(def.min, parsed[def.key]));
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // silently fail
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function getDefaults() {
  const defaults = {};
  for (const def of SETTINGS_DEFS) {
    defaults[def.key] = def.default;
  }
  return defaults;
}

export function applyUserSettings() {
  const settings = loadSettings();
  if (!settings) return;
  for (const def of SETTINGS_DEFS) {
    if (def.key in settings && def.configPath) {
      setByPath(CONFIG, def.configPath, settings[def.key]);
    }
  }
}
