import { getEnemyType, getConfig } from './gameConfig.js';

export class Enemy {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.typeDef = typeDef;
    this.type = typeDef.type;
    this.radius = typeDef.radius;
    this.hp = typeDef.hp;
    this.maxHp = typeDef.hp;
    this.speed = typeDef.speed;
    this.damage = typeDef.damage;
    this.color = typeDef.color;
    this.icon = typeDef.icon || '👾';
    this.exp = typeDef.exp;
    this.alive = true;
    this.hitFlashTimer = 0;

    // Shooter cooldown
    this.fireCooldown = typeDef.behavior?.fireRate || 0;

    // Status effects
    this.frozen = 0;   // timer in seconds; movement/attack disabled while > 0
    this.poisoned = 0; // timer in seconds
    this.poisonDps = 0; // DPS while poisoned
    this.stunned = 0;  // timer in seconds

    // Dasher state
    this._dashTimer = typeDef.behavior?.dashInterval ?? 1.5;
    this._dashing = false;
    this._dashVx = 0;
    this._dashVy = 0;

    // Healer state
    this._healTimer = 0;

    // Phase transition (boss)
    this._phaseTriggered = false;
    this._phaseColor = null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = 0.1;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  update(playerPos, dt, enemyProjectiles, spawnedMinions, allEnemies) {
    if (!this.alive) return;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Tick status effects
    if (this.frozen > 0) {
      this.frozen -= dt;
      return; // frozen: skip movement and attacks
    }
    if (this.stunned > 0) {
      this.stunned -= dt;
      return;
    }
    if (this.poisoned > 0) {
      this.poisoned -= dt;
      this.takeDamage(this.poisonDps * dt);
      if (!this.alive) return;
    }

    const behavior = behaviors[this.type];
    if (behavior) {
      behavior(this, playerPos, dt, enemyProjectiles, spawnedMinions, allEnemies);
    }

    // Clamp inside room walls (archero mode — canvas-based room)
    if (this._canvasW && this._canvasH) {
      const wall = getConfig().room?.wallThickness ?? 20;
      this.x = Math.max(wall + this.radius, Math.min(this._canvasW - wall - this.radius, this.x));
      this.y = Math.max(wall + this.radius, Math.min(this._canvasH - wall - this.radius, this.y));
    }
  }
}

// Behavior functions - each modifies enemy position/state
export const behaviors = {
  charger(enemy, playerPos, dt) {
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      enemy.x += (dx / dist) * enemy.speed * dt;
      enemy.y += (dy / dist) * enemy.speed * dt;
    }
  },

  shooter(enemy, playerPos, dt, enemyProjectiles) {
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const preferred = enemy.typeDef.behavior.preferredDistance;

    // Move away if too close, toward if too far
    if (dist > 0) {
      const moveDir = dist < preferred ? -1 : 1;
      enemy.x += (dx / dist) * enemy.speed * dt * moveDir;
      enemy.y += (dy / dist) * enemy.speed * dt * moveDir;
    }

    // Fire projectile
    enemy.fireCooldown -= dt;
    if (enemy.fireCooldown <= 0 && enemyProjectiles) {
      const b = enemy.typeDef.behavior;
      enemy.fireCooldown = b.fireRate;
      if (dist > 0) {
        enemyProjectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (dx / dist) * b.projectileSpeed,
          vy: (dy / dist) * b.projectileSpeed,
          radius: b.projectileRadius,
          color: b.projectileColor,
          damage: b.projectileDamage,
          isEnemy: true,
          alive: true,
        });
      }
    }
  },

  tank(enemy, playerPos, dt) {
    behaviors.charger(enemy, playerPos, dt);
  },

  exploder(enemy, playerPos, dt) {
    behaviors.charger(enemy, playerPos, dt);
  },

  summoner(enemy, playerPos, dt, enemyProjectiles, spawnedMinions) {
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const preferred = enemy.typeDef.behavior?.preferredDistance || 200;

    if (dist > 0) {
      const moveDir = dist < preferred ? -1 : 1;
      enemy.x += (dx / dist) * enemy.speed * dt * moveDir;
      enemy.y += (dy / dist) * enemy.speed * dt * moveDir;
    }

    if (!enemy.summonTimer) enemy.summonTimer = enemy.typeDef.behavior?.summonInterval || 4;
    enemy.summonTimer -= dt;

    if (enemy.summonTimer <= 0 && spawnedMinions) {
      const b = enemy.typeDef.behavior;
      const minionType = getEnemyType(b.summonId);
      if (minionType) {
        for (let i = 0; i < (b.summonCount || 1); i++) {
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = 30 + Math.random() * 40;
          const mx = enemy.x + Math.cos(angle) * spawnDist;
          const my = enemy.y + Math.sin(angle) * spawnDist;
          spawnedMinions.push(new Enemy(mx, my, minionType));
        }
      }
      enemy.summonTimer = b.summonInterval || 4;
    }
  },

  // Shielder: moves toward player; blocks projectiles from frontal 120° arc
  shielder(enemy, playerPos, dt) {
    behaviors.charger(enemy, playerPos, dt);
    // Facing angle tracks player
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    enemy._facingAngle = Math.atan2(dy, dx);
  },

  // Healer: keeps distance; heals lowest-HP nearby enemy each tick
  healer(enemy, playerPos, dt, enemyProjectiles, spawnedMinions, allEnemies) {
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const preferred = enemy.typeDef.behavior?.preferredDistance ?? 200;

    if (dist > 0) {
      const moveDir = dist < preferred ? -1 : 1;
      enemy.x += (dx / dist) * enemy.speed * dt * moveDir;
      enemy.y += (dy / dist) * enemy.speed * dt * moveDir;
    }

    // Heal lowest-HP nearby ally
    const healRange = enemy.typeDef.behavior?.healRange ?? 150;
    const healRate = enemy.typeDef.behavior?.healRate ?? 5;
    enemy._healTimer -= dt;
    if (enemy._healTimer <= 0 && allEnemies) {
      enemy._healTimer = 1; // heal once per second
      let target = null;
      let lowestHpRatio = 1;
      for (const e of allEnemies) {
        if (e === enemy || !e.alive) continue;
        const ex = e.x - enemy.x;
        const ey = e.y - enemy.y;
        if (ex * ex + ey * ey < healRange * healRange) {
          const ratio = e.hp / e.maxHp;
          if (ratio < lowestHpRatio) {
            lowestHpRatio = ratio;
            target = e;
          }
        }
      }
      if (target) {
        target.hp = Math.min(target.maxHp, target.hp + healRate);
      }
    }
  },

  // Dasher: pauses then dashes at player at high speed
  dasher(enemy, playerPos, dt) {
    const b = enemy.typeDef.behavior;
    const dashInterval = b?.dashInterval ?? 1.5;
    const dashSpeed = b?.dashSpeed ?? 400;

    if (enemy._dashing) {
      // Continue dash
      enemy.x += enemy._dashVx * dt;
      enemy.y += enemy._dashVy * dt;

      // Stop dashing when close enough or after short time
      const dx = playerPos.x - enemy.x;
      const dy = playerPos.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (!enemy._dashDuration) enemy._dashDuration = 0.4;
      enemy._dashDuration -= dt;
      if (enemy._dashDuration <= 0 || dist < enemy.radius + 20) {
        enemy._dashing = false;
        enemy._dashTimer = dashInterval;
        enemy._dashDuration = 0;
      }
    } else {
      // Count down to next dash
      enemy._dashTimer -= dt;
      if (enemy._dashTimer <= 0) {
        // Start dash toward current player position
        const dx = playerPos.x - enemy.x;
        const dy = playerPos.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          enemy._dashVx = (dx / dist) * dashSpeed;
          enemy._dashVy = (dy / dist) * dashSpeed;
          enemy._dashing = true;
          enemy._dashDuration = 0.4;
        }
      }
    }
  },
};

// Check if a projectile is blocked by a shielder's frontal arc
export function isBlockedByShielder(projectile, shielder) {
  if (shielder.type !== 'shielder') return false;
  if (shielder._facingAngle === undefined) return false;

  const shieldArc = (shielder.typeDef.behavior?.shieldArc ?? 120) * Math.PI / 180;
  // Angle from shielder to projectile (projectile coming from this direction)
  const dx = projectile.x - shielder.x;
  const dy = projectile.y - shielder.y;
  const projAngle = Math.atan2(dy, dx);

  // Angular difference between facing and projectile direction
  let diff = projAngle - shielder._facingAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return Math.abs(diff) < shieldArc / 2;
}
