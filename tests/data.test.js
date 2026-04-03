import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, getEnemyType, getSpawnableEnemies, getBossForPhase } from '../src/data/enemies.js';
import { WEAPON_DEFINITIONS, getWeaponDefinition } from '../src/data/weapons.js';
import { SKILL_DEFINITIONS, getSkillDefinition, getRandomSkillChoices } from '../src/data/skills.js';

describe('Enemy Data', () => {
  it('all enemies have required fields', () => {
    const requiredFields = ['id', 'name', 'type', 'radius', 'hp', 'speed', 'damage', 'color', 'exp'];
    ENEMY_TYPES.forEach(enemy => {
      requiredFields.forEach(field => {
        expect(enemy[field], `${enemy.id} missing ${field}`).toBeDefined();
      });
    });
  });

  it('all enemy ids are unique', () => {
    const ids = ENEMY_TYPES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getEnemyType returns correct enemy', () => {
    const slime = getEnemyType('slime');
    expect(slime).toBeDefined();
    expect(slime.name).toBe('史萊姆');
  });

  it('getEnemyType returns undefined for invalid id', () => {
    expect(getEnemyType('nonexistent')).toBeUndefined();
  });

  it('getSpawnableEnemies filters by time and excludes bosses', () => {
    const early = getSpawnableEnemies(0);
    expect(early.length).toBeGreaterThan(0);
    expect(early.every(e => e.unlockTime <= 0)).toBe(true);
    expect(early.every(e => e.weight > 0)).toBe(true);

    const late = getSpawnableEnemies(999);
    expect(late.length).toBeGreaterThanOrEqual(early.length);
  });

  it('getBossForPhase returns correct boss', () => {
    const boss1 = getBossForPhase(1);
    expect(boss1).toBeDefined();
    expect(boss1.type).toBe('boss');
    expect(boss1.bossPhase).toBe(1);
  });

  it('shooter enemies have behavior config', () => {
    const shooters = ENEMY_TYPES.filter(e => e.type === 'shooter');
    shooters.forEach(s => {
      expect(s.behavior, `${s.id} missing behavior`).toBeDefined();
      expect(s.behavior.projectileSpeed).toBeGreaterThan(0);
      expect(s.behavior.fireRate).toBeGreaterThan(0);
    });
  });

  it('exploder enemies have explosion config', () => {
    const exploders = ENEMY_TYPES.filter(e => e.type === 'exploder');
    exploders.forEach(e => {
      expect(e.behavior.explosionRadius).toBeGreaterThan(0);
      expect(e.behavior.explosionDamage).toBeGreaterThan(0);
    });
  });
});

describe('Weapon Data', () => {
  it('all weapons have required fields', () => {
    const required = ['id', 'name', 'description', 'type', 'damage', 'cooldown', 'color', 'maxLevel', 'config'];
    WEAPON_DEFINITIONS.forEach(w => {
      required.forEach(field => {
        expect(w[field], `${w.id} missing ${field}`).toBeDefined();
      });
    });
  });

  it('all weapon ids are unique', () => {
    const ids = WEAPON_DEFINITIONS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getWeaponDefinition returns deep copy', () => {
    const arrow1 = getWeaponDefinition('arrow');
    const arrow2 = getWeaponDefinition('arrow');
    expect(arrow1).toEqual(arrow2);
    arrow1.damage = 999;
    expect(arrow2.damage).not.toBe(999);
  });

  it('getWeaponDefinition returns null for invalid id', () => {
    expect(getWeaponDefinition('nonexistent')).toBeNull();
  });
});

describe('Skill Data', () => {
  it('all skills have required fields', () => {
    const required = ['id', 'name', 'description', 'category', 'icon', 'maxLevel'];
    SKILL_DEFINITIONS.forEach(s => {
      required.forEach(field => {
        expect(s[field], `${s.id} missing ${field}`).toBeDefined();
      });
    });
  });

  it('weapon skills reference valid weapon ids', () => {
    const weaponIds = new Set(WEAPON_DEFINITIONS.map(w => w.id));
    const weaponSkills = SKILL_DEFINITIONS.filter(s => s.category === 'weapon');
    weaponSkills.forEach(s => {
      expect(weaponIds.has(s.weaponId), `${s.id} references invalid weapon ${s.weaponId}`).toBe(true);
    });
  });

  it('passive skills have stat and value', () => {
    const passives = SKILL_DEFINITIONS.filter(s => s.category === 'passive');
    passives.forEach(s => {
      expect(s.stat, `${s.id} missing stat`).toBeDefined();
      expect(s.value, `${s.id} missing value`).toBeDefined();
      expect(['flat', 'percent']).toContain(s.valueType);
    });
  });

  it('getRandomSkillChoices returns correct count', () => {
    const choices = getRandomSkillChoices(3, {});
    expect(choices.length).toBe(3);
  });

  it('getRandomSkillChoices excludes maxed skills', () => {
    const maxedLevels = {};
    SKILL_DEFINITIONS.forEach(s => { maxedLevels[s.id] = s.maxLevel; });

    const choices = getRandomSkillChoices(3, maxedLevels);
    expect(choices.length).toBe(0);
  });

  it('getRandomSkillChoices returns no duplicates', () => {
    const choices = getRandomSkillChoices(5, {});
    const ids = choices.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
