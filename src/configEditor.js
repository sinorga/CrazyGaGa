// configEditor.js — in-game configuration editor
// Manages editor state, field building, HTML input overlay, export/import.

import {
  getConfig, getEnemyTypes, getWeaponDefs, getSkillDefs, getCharacterDefs, getUpgradeDefs,
  getConfigDefaults, getEnemyDefaults, getWeaponDefaults, getSkillDefaults,
  getCharacterDefaults, getUpgradeDefaults,
  setOverride, resetAllOverrides, exportJSON, importJSON, reloadCache,
} from './gameConfig.js';

export const TABS = ['global', 'enemies', 'weapons', 'passives', 'characters', 'upgrades'];
export const TAB_LABELS = {
  global: 'Global', enemies: 'Enemies', weapons: 'Weapons',
  passives: 'Skills', characters: 'Chars', upgrades: 'Upgrades',
};

const ROW_H = 38;
const TAB_BAR_H = 42;
const BOTTOM_H = 50;
const LABEL_COL = 0.55; // fraction of width for label / value split

// ─── State factory ───────────────────────────────────────────────────────────

export function createConfigEditorState() {
  const state = {
    activeTab: 'global',
    scrollY: 0,
    fields: [],
    _inputEl: null,
    _inputFieldIdx: -1,
  };
  buildFields(state);
  return state;
}

// ─── Field building ───────────────────────────────────────────────────────────

// A field descriptor:
// { label, value, defaultValue, section, id, path, isHeader, isModified }

function flattenObject(obj, prefix, defaults, out) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const defVal = defaults?.[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenObject(val, path, defVal, out);
    } else if (typeof val === 'number') {
      out.push({ label: path, value: val, defaultValue: defVal, path, isModified: val !== defVal });
    }
  }
}

function buildGlobalFields() {
  const cfg = getConfig();
  const defaults = getConfigDefaults();
  const fields = [{ label: '── Global Config ──', isHeader: true }];
  flattenObject(cfg, '', defaults, fields);
  // Tag each with section/id/path for setOverride calls
  for (const f of fields) {
    if (!f.isHeader) {
      f.section = 'config';
      f.id = null;
    }
  }
  return fields;
}

function buildEntityFields(section, mergedArr, defaultsArr, editableKeys) {
  const fields = [];
  const defaultsMap = Object.fromEntries(defaultsArr.map(e => [e.id, e]));
  for (const entity of mergedArr) {
    fields.push({ label: `── ${entity.name || entity.id} ──`, isHeader: true });
    const defaults = defaultsMap[entity.id] || {};
    // Top-level numeric fields
    for (const key of editableKeys) {
      if (typeof entity[key] !== 'number') continue;
      const defVal = defaults[key];
      fields.push({
        label: key, value: entity[key], defaultValue: defVal,
        section, id: entity.id, path: key, isModified: entity[key] !== defVal,
      });
    }
    // Behavior sub-fields
    if (entity.behavior && typeof entity.behavior === 'object') {
      for (const [bk, bv] of Object.entries(entity.behavior)) {
        if (typeof bv !== 'number') continue;
        const defVal = defaults.behavior?.[bk];
        fields.push({
          label: `behavior.${bk}`, value: bv, defaultValue: defVal,
          section, id: entity.id, path: `behavior.${bk}`, isModified: bv !== defVal,
        });
      }
    }
    // Boss attack numeric fields
    if (entity.attacks && Array.isArray(entity.attacks)) {
      entity.attacks.forEach((atk, i) => {
        const defAtk = (defaults.attacks || [])[i] || {};
        for (const [ak, av] of Object.entries(atk)) {
          if (typeof av !== 'number') continue;
          const defVal = defAtk[ak];
          fields.push({
            label: `attacks[${i}].${ak}`, value: av, defaultValue: defVal,
            section, id: entity.id, path: `attacks[${i}].${ak}`, isModified: av !== defVal,
          });
        }
      });
    }
  }
  return fields;
}

function buildWeaponFields() {
  const fields = [];
  const weapons = getWeaponDefs();
  const defaults = getWeaponDefaults();
  const defMap = Object.fromEntries(defaults.map(w => [w.id, w]));
  for (const w of weapons) {
    fields.push({ label: `── ${w.icon || ''} ${w.name} ──`, isHeader: true });
    const def = defMap[w.id] || {};
    const topKeys = ['damage', 'cooldown', 'maxLevel'];
    for (const key of topKeys) {
      if (typeof w[key] !== 'number') continue;
      fields.push({
        label: key, value: w[key], defaultValue: def[key],
        section: 'weapons', id: w.id, path: key, isModified: w[key] !== def[key],
      });
    }
    if (w.config && typeof w.config === 'object') {
      for (const [ck, cv] of Object.entries(w.config)) {
        if (typeof cv !== 'number') continue;
        fields.push({
          label: `config.${ck}`, value: cv, defaultValue: def.config?.[ck],
          section: 'weapons', id: w.id, path: `config.${ck}`,
          isModified: cv !== def.config?.[ck],
        });
      }
    }
  }
  return fields;
}

function buildPassiveFields() {
  const fields = [{ label: '── Passive Skills ──', isHeader: true }];
  const skills = getSkillDefs().filter(s => s.category === 'passive');
  const defaults = getSkillDefaults().filter(s => s.category === 'passive');
  const defMap = Object.fromEntries(defaults.map(s => [s.id, s]));
  for (const s of skills) {
    const def = defMap[s.id] || {};
    fields.push({ label: `${s.icon || ''} ${s.name} — value`, value: s.value, defaultValue: def.value, section: 'skills', id: s.id, path: 'value', isModified: s.value !== def.value });
    fields.push({ label: `${s.icon || ''} ${s.name} — maxLevel`, value: s.maxLevel, defaultValue: def.maxLevel, section: 'skills', id: s.id, path: 'maxLevel', isModified: s.maxLevel !== def.maxLevel });
  }
  return fields;
}

function buildCharacterFields() {
  const fields = [];
  const chars = getCharacterDefs();
  const defaults = getCharacterDefaults();
  const defMap = Object.fromEntries(defaults.map(c => [c.id, c]));
  for (const c of chars) {
    const def = defMap[c.id] || {};
    fields.push({ label: `── ${c.name} ──`, isHeader: true });
    fields.push({ label: 'unlockCost', value: c.unlockCost, defaultValue: def.unlockCost, section: 'characters', id: c.id, path: 'unlockCost', isModified: c.unlockCost !== def.unlockCost });
    for (const [sk, sv] of Object.entries(c.baseStats || {})) {
      if (typeof sv !== 'number') continue;
      fields.push({ label: `baseStats.${sk}`, value: sv, defaultValue: def.baseStats?.[sk], section: 'characters', id: c.id, path: `baseStats.${sk}`, isModified: sv !== def.baseStats?.[sk] });
    }
  }
  return fields;
}

function buildUpgradeFields() {
  const fields = [];
  const upgrades = getUpgradeDefs();
  const defaults = getUpgradeDefaults();
  const defMap = Object.fromEntries(defaults.map(u => [u.id, u]));
  for (const u of upgrades) {
    const def = defMap[u.id] || {};
    fields.push({ label: `── ${u.name} ──`, isHeader: true });
    fields.push({ label: 'maxLevel', value: u.maxLevel, defaultValue: def.maxLevel, section: 'upgrades', id: u.id, path: 'maxLevel', isModified: u.maxLevel !== def.maxLevel });
    u.costs.forEach((cost, i) => {
      fields.push({ label: `costs[${i}]`, value: cost, defaultValue: def.costs?.[i], section: 'upgrades', id: u.id, path: `costs[${i}]`, isModified: cost !== def.costs?.[i] });
    });
    u.values.forEach((val, i) => {
      fields.push({ label: `values[${i}]`, value: val, defaultValue: def.values?.[i], section: 'upgrades', id: u.id, path: `values[${i}]`, isModified: val !== def.values?.[i] });
    });
  }
  return fields;
}

export function buildFields(state) {
  const ENEMY_KEYS = ['radius', 'hp', 'speed', 'damage', 'exp', 'unlockTime', 'weight'];
  switch (state.activeTab) {
    case 'global':     state.fields = buildGlobalFields(); break;
    case 'enemies':    state.fields = buildEntityFields('enemies', getEnemyTypes(), getEnemyDefaults(), ENEMY_KEYS); break;
    case 'weapons':    state.fields = buildWeaponFields(); break;
    case 'passives':   state.fields = buildPassiveFields(); break;
    case 'characters': state.fields = buildCharacterFields(); break;
    case 'upgrades':   state.fields = buildUpgradeFields(); break;
  }
}

// ─── Input handling ───────────────────────────────────────────────────────────

export function handleClick(state, x, y, canvas, onBack) {
  const W = canvas.width;
  const H = canvas.height;

  // Tab bar
  if (y < TAB_BAR_H) {
    const tabW = W / TABS.length;
    const idx = Math.floor(x / tabW);
    if (idx >= 0 && idx < TABS.length) {
      state.activeTab = TABS[idx];
      state.scrollY = 0;
      _removeInput(state);
      buildFields(state);
    }
    return;
  }

  // Bottom buttons
  if (y > H - BOTTOM_H) {
    const btnW = 120;
    const gap = 10;
    const totalBtns = 4;
    const totalW = totalBtns * btnW + (totalBtns - 1) * gap;
    const startX = (W - totalW) / 2;
    const btnY = H - BOTTOM_H + 8;
    const btnH = 34;
    for (let i = 0; i < totalBtns; i++) {
      const bx = startX + i * (btnW + gap);
      if (x >= bx && x <= bx + btnW && y >= btnY && y <= btnY + btnH) {
        _handleButtonClick(state, i, canvas, onBack);
        return;
      }
    }
    return;
  }

  // Field rows
  const contentY = TAB_BAR_H;
  const fieldY = y - contentY + state.scrollY;
  const rowIdx = Math.floor(fieldY / ROW_H);
  if (rowIdx < 0 || rowIdx >= state.fields.length) return;
  const field = state.fields[rowIdx];
  if (!field || field.isHeader) return;

  // Click on value column (right half)
  const valueColX = W * LABEL_COL;
  if (x < valueColX) return;

  // Remove existing input if any
  _removeInput(state);

  // Create HTML input overlay
  const rowScreenY = contentY + rowIdx * ROW_H - state.scrollY;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / W;
  const scaleY = rect.height / H;

  const inp = document.createElement('input');
  inp.type = 'number';
  inp.value = field.value;
  inp.step = field.value < 1 ? 0.01 : (field.value < 10 ? 0.1 : 1);
  inp.style.cssText = `
    position: fixed;
    left: ${rect.left + valueColX * scaleX}px;
    top: ${rect.top + rowScreenY * scaleY}px;
    width: ${(W - valueColX - 4) * scaleX}px;
    height: ${ROW_H * scaleY}px;
    background: #1e1e4e;
    color: #ffdd44;
    border: 2px solid #6688ff;
    font: bold 14px monospace;
    padding: 4px 6px;
    box-sizing: border-box;
    z-index: 1000;
    outline: none;
  `;
  document.body.appendChild(inp);
  inp.focus();
  inp.select();

  state._inputEl = inp;
  state._inputFieldIdx = rowIdx;

  const commit = () => {
    const raw = parseFloat(inp.value);
    if (!isNaN(raw)) {
      setOverride(field.section, field.id, field.path, raw);
      buildFields(state);
    }
    _removeInput(state);
  };

  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { inp.blur(); }
    if (e.key === 'Escape') { _removeInput(state); }
  });
}

function _handleButtonClick(state, btnIdx, canvas, onBack) {
  switch (btnIdx) {
    case 0: _doExport(); break;
    case 1: _doImport(state, canvas); break;
    case 2: resetAllOverrides(); buildFields(state); break;
    case 3: _removeInput(state); if (onBack) onBack(); break;
  }
}

function _doExport() {
  const json = exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crazygaga-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function _doImport(state, canvas) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.addEventListener('change', () => {
    const file = inp.files[0];
    if (!file) { inp.remove(); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        importJSON(e.target.result);
        buildFields(state);
      } catch (err) {
        console.error('Import failed:', err);
      }
      inp.remove();
    };
    reader.readAsText(file);
  });
  inp.click();
}

function _removeInput(state) {
  if (state._inputEl) {
    state._inputEl.removeEventListener('blur', () => {});
    try { document.body.removeChild(state._inputEl); } catch {}
    state._inputEl = null;
    state._inputFieldIdx = -1;
  }
}

export function handleScroll(state, delta, canvas) {
  const contentRows = state.fields.length;
  const visibleRows = Math.floor((canvas.height - TAB_BAR_H - BOTTOM_H) / ROW_H);
  const maxScroll = Math.max(0, (contentRows - visibleRows) * ROW_H);
  state.scrollY = Math.max(0, Math.min(maxScroll, state.scrollY + delta));
}

export function cleanup(state) {
  _removeInput(state);
}
