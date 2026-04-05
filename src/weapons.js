import { getWeaponDef as getWeaponDefinition } from './gameConfig.js';
import { Projectile } from './projectile.js';
import { distance } from './collision.js';

export function createWeaponInstance(weaponId) {
  const def = getWeaponDefinition(weaponId);
  if (!def) return null;
  return {
    ...def,
    level: 1,
    cooldownTimer: 0,
    angle: 0, // for orbit weapons
    orbs: [], // for orbit weapon positions
  };
}

export class WeaponManager {
  constructor() {
    this.weapons = [];
  }

  addWeapon(weaponId) {
    const existing = this.weapons.find(w => w.id === weaponId);
    if (existing) {
      existing.level++;
      // Apply level scaling
      const scaling = existing.levelScaling;
      if (scaling.damage) existing.damage *= scaling.damage;
      if (scaling.cooldown) existing.cooldown *= scaling.cooldown;
      return;
    }
    const w = createWeaponInstance(weaponId);
    if (w) this.weapons.push(w);
  }

  hasWeapon(weaponId) {
    return this.weapons.some(w => w.id === weaponId);
  }

  update(dt, player, enemies, projectiles, isMoving) {
    for (const weapon of this.weapons) {
      weapon.cooldownTimer -= dt;

      switch (weapon.type) {
        case 'projectile':
          this._updateProjectile(weapon, dt, player, enemies, projectiles, isMoving);
          break;
        case 'orbit':
          this._updateOrbit(weapon, dt, player, enemies);
          break;
        case 'chain':
          this._updateChain(weapon, dt, player, enemies, isMoving);
          break;
        case 'area':
          this._updateArea(weapon, dt, player, enemies, isMoving);
          break;
        case 'boomerang':
          this._updateBoomerang(weapon, dt, player, enemies, projectiles, isMoving);
          break;
      }
    }
  }

  _updateProjectile(weapon, dt, player, enemies, projectiles, isMoving) {
    if (isMoving) return; // Archero-style: no shooting while moving
    if (weapon.cooldownTimer > 0) return;

    const target = this._findNearest(player, enemies);
    if (!target) return;

    weapon.cooldownTimer = weapon.cooldown * player.cooldownMultiplier;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const baseAngle = Math.atan2(dy, dx);
    const sl = player.skillLevels || {};

    // Bounce/ricochet options
    const bounces = (sl['skill_bounce'] || 0) > 0 ? 2 : 0;
    const ricochet = (sl['skill_ricochet'] || 0) > 0;

    const opts = {
      damage: weapon.damage * player.damageMultiplier,
      radius: weapon.config.radius,
      pierce: weapon.config.pierce + Math.floor((weapon.level - 1) / 2),
      color: weapon.color,
      bounces,
      ricochet,
    };

    // Multishot: 3-arrow fan replaces single (only for primary)
    const useMultishot = (sl['skill_multishot'] || 0) > 0;

    // Primary shot(s)
    if (useMultishot) {
      const fanAngles = [-Math.PI / 12, 0, Math.PI / 12]; // 15° either side in 30° fan
      for (const offset of fanAngles) {
        const a = baseAngle + offset;
        projectiles.push(new Projectile(player.x, player.y, Math.cos(a), Math.sin(a), weapon.config.speed, opts));
      }
    } else {
      const count = weapon.config.count || 1;
      const spread = weapon.config.spread || 0;
      for (let i = 0; i < count; i++) {
        const a = baseAngle + (i - (count - 1) / 2) * spread;
        projectiles.push(new Projectile(player.x, player.y, Math.cos(a), Math.sin(a), weapon.config.speed, opts));
      }
    }

    // Diagonal arrows: 2 extra at ±45°
    if ((sl['skill_diagonal'] || 0) > 0) {
      for (const offset of [-Math.PI / 4, Math.PI / 4]) {
        const a = baseAngle + offset;
        projectiles.push(new Projectile(player.x, player.y, Math.cos(a), Math.sin(a), weapon.config.speed, opts));
      }
    }

    // Side arrows: 1 left + 1 right (perpendicular)
    if ((sl['skill_side_arrow'] || 0) > 0) {
      for (const offset of [-Math.PI / 2, Math.PI / 2]) {
        const a = baseAngle + offset;
        projectiles.push(new Projectile(player.x, player.y, Math.cos(a), Math.sin(a), weapon.config.speed, opts));
      }
    }

    // Back arrow: 1 in exact opposite direction
    if ((sl['skill_back_arrow'] || 0) > 0) {
      const a = baseAngle + Math.PI;
      projectiles.push(new Projectile(player.x, player.y, Math.cos(a), Math.sin(a), weapon.config.speed, opts));
    }
  }

  _updateOrbit(weapon, dt, player) {
    const cfg = weapon.config;
    weapon.angle += cfg.orbitSpeed * dt;
    const count = cfg.count + (weapon.level - 1); // +1 orb every level
    const radius = cfg.orbitRadius + weapon.level * 3;

    weapon.orbs = [];
    for (let i = 0; i < count; i++) {
      const a = weapon.angle + (i * Math.PI * 2) / count;
      weapon.orbs.push({
        x: player.x + Math.cos(a) * radius,
        y: player.y + Math.sin(a) * radius,
        radius: cfg.radius,
        damage: weapon.damage * player.damageMultiplier,
        color: weapon.color,
      });
    }
  }

  _updateChain(weapon, dt, player, enemies, isMoving) {
    if (isMoving) return;
    if (weapon.cooldownTimer > 0) return;

    const target = this._findNearest(player, enemies);
    if (!target) return;

    const dist = distance(player, target);
    if (dist > weapon.config.range) return;

    weapon.cooldownTimer = weapon.cooldown * player.cooldownMultiplier;

    // Damage chain targets
    const chainCount = weapon.config.chainCount + Math.floor((weapon.level - 1) / 2);
    const hit = new Set();
    let current = target;
    const dmg = weapon.damage * player.damageMultiplier;

    // Store chain visual data
    weapon.chainTargets = [{ x: player.x, y: player.y }];

    for (let i = 0; i <= chainCount && current; i++) {
      current.takeDamage(dmg);
      hit.add(current);
      weapon.chainTargets.push({ x: current.x, y: current.y });

      // Find next chain target
      let nearest = null;
      let nearDist = weapon.config.chainRange;
      for (const e of enemies) {
        if (!e.alive || hit.has(e)) continue;
        const d = distance(current, e);
        if (d < nearDist) {
          nearDist = d;
          nearest = e;
        }
      }
      current = nearest;
    }

    weapon.chainTimer = weapon.config.duration;
  }

  _updateArea(weapon, dt, player, enemies, isMoving) {
    if (isMoving && weapon.id !== 'fire_circle') return; // fire circle works while moving
    if (weapon.cooldownTimer > 0) return;

    weapon.cooldownTimer = weapon.cooldown * player.cooldownMultiplier;

    const count = weapon.config.count || 1;
    const dmg = weapon.damage * player.damageMultiplier;
    const radius = weapon.config.radius + weapon.level * 5;

    weapon.areas = [];
    for (let i = 0; i < count; i++) {
      // Place on random enemies or near player
      let tx = player.x, ty = player.y;
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const offset = weapon.config.randomOffset || 0;
        tx = target.x + (Math.random() - 0.5) * offset;
        ty = target.y + (Math.random() - 0.5) * offset;
      }
      weapon.areas.push({
        x: tx, y: ty,
        radius,
        damage: dmg,
        color: weapon.color,
        duration: weapon.config.duration,
        tickRate: weapon.config.tickRate,
        tickTimer: 0,
        timer: weapon.config.duration,
      });
    }
  }

  _updateBoomerang(weapon, dt, player, enemies, projectiles, isMoving) {
    if (isMoving) return;
    if (weapon.cooldownTimer > 0) return;

    const target = this._findNearest(player, enemies);
    if (!target) return;

    weapon.cooldownTimer = weapon.cooldown * player.cooldownMultiplier;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    projectiles.push(new Projectile(player.x, player.y, dirX, dirY, weapon.config.speed, {
      damage: weapon.damage * player.damageMultiplier,
      radius: weapon.config.radius,
      pierce: weapon.config.pierce,
      color: weapon.color,
      isBoomerang: true,
      owner: player,
      maxRange: weapon.config.range + weapon.level * 20,
      startX: player.x,
      startY: player.y,
      returning: false,
    }));
  }

  _findNearest(player, enemies) {
    let nearest = null;
    let nearDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = distance(player, e);
      if (d < nearDist) {
        nearDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  reset() {
    this.weapons = [];
  }
}
