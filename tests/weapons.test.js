import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponManager, createWeaponInstance } from '../src/weapons.js';

describe('createWeaponInstance', () => {
  it('creates weapon from definition id', () => {
    const w = createWeaponInstance('arrow');
    expect(w).toBeDefined();
    expect(w.id).toBe('arrow');
    expect(w.level).toBe(1);
    expect(w.cooldownTimer).toBe(0);
  });

  it('returns null for invalid id', () => {
    expect(createWeaponInstance('nonexistent')).toBeNull();
  });
});

describe('WeaponManager', () => {
  let wm;

  beforeEach(() => {
    wm = new WeaponManager();
  });

  it('starts with no weapons', () => {
    expect(wm.weapons.length).toBe(0);
  });

  it('adds a weapon', () => {
    wm.addWeapon('arrow');
    expect(wm.weapons.length).toBe(1);
    expect(wm.weapons[0].id).toBe('arrow');
  });

  it('levels up existing weapon instead of duplicating', () => {
    wm.addWeapon('arrow');
    wm.addWeapon('arrow');
    expect(wm.weapons.length).toBe(1);
    expect(wm.weapons[0].level).toBe(2);
  });

  it('has weapon check', () => {
    wm.addWeapon('arrow');
    expect(wm.hasWeapon('arrow')).toBe(true);
    expect(wm.hasWeapon('magic_orb')).toBe(false);
  });

  it('creates projectiles when updating projectile weapon', () => {
    wm.addWeapon('arrow');
    const w = wm.weapons[0];
    w.cooldownTimer = 0; // ready to fire

    const player = { x: 100, y: 100, damageMultiplier: 1, cooldownMultiplier: 1 };
    const enemies = [{ x: 200, y: 100, alive: true, radius: 10 }];
    const projectiles = [];

    wm.update(0.1, player, enemies, projectiles, false); // not moving
    expect(projectiles.length).toBe(1);
  });

  it('does not fire projectile weapons when player is moving', () => {
    wm.addWeapon('arrow');
    const w = wm.weapons[0];
    w.cooldownTimer = 0;

    const player = { x: 100, y: 100, damageMultiplier: 1, cooldownMultiplier: 1 };
    const enemies = [{ x: 200, y: 100, alive: true, radius: 10 }];
    const projectiles = [];

    wm.update(0.1, player, enemies, projectiles, true); // moving
    expect(projectiles.length).toBe(0);
  });

  it('orbit weapon works even when moving', () => {
    wm.addWeapon('magic_orb');
    const w = wm.weapons[0];

    const player = { x: 100, y: 100, damageMultiplier: 1, cooldownMultiplier: 1 };
    const enemies = [];
    const projectiles = [];

    wm.update(1.0, player, enemies, projectiles, true); // moving
    // Orbit updates angle even while moving
    expect(w.angle).toBeGreaterThan(0);
  });

  it('respects cooldown', () => {
    wm.addWeapon('arrow');
    const w = wm.weapons[0];
    w.cooldownTimer = 10; // not ready

    const player = { x: 100, y: 100, damageMultiplier: 1, cooldownMultiplier: 1 };
    const enemies = [{ x: 200, y: 100, alive: true, radius: 10 }];
    const projectiles = [];

    wm.update(0.1, player, enemies, projectiles, false);
    expect(projectiles.length).toBe(0);
  });

  it('weapon leveling scales damage', () => {
    wm.addWeapon('arrow');
    const dmg1 = wm.weapons[0].damage;
    wm.addWeapon('arrow'); // level 2
    expect(wm.weapons[0].damage).toBeGreaterThan(dmg1);
  });

  it('resets all weapons', () => {
    wm.addWeapon('arrow');
    wm.addWeapon('magic_orb');
    wm.reset();
    expect(wm.weapons.length).toBe(0);
  });
});
