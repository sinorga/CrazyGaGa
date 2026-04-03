import { CONFIG } from './config.js';

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
    this.exp = typeDef.exp;
    this.alive = true;

    // Shooter cooldown
    this.fireCooldown = typeDef.behavior?.fireRate || 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  update(playerPos, dt, enemyProjectiles) {
    if (!this.alive) return;
    const behavior = behaviors[this.type];
    if (behavior) {
      behavior(this, playerPos, dt, enemyProjectiles);
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
    // Same as charger, just naturally slower from stats
    behaviors.charger(enemy, playerPos, dt);
  },

  exploder(enemy, playerPos, dt) {
    // Move like charger; explosion handled on death in game.js
    behaviors.charger(enemy, playerPos, dt);
  },

  summoner(enemy, playerPos, dt) {
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const preferred = enemy.typeDef.behavior?.preferredDistance || 200;

    // Keep distance like shooter
    if (dist > 0) {
      const moveDir = dist < preferred ? -1 : 1;
      enemy.x += (dx / dist) * enemy.speed * dt * moveDir;
      enemy.y += (dy / dist) * enemy.speed * dt * moveDir;
    }

    // Summoning handled in game.js via timer
    if (!enemy.summonTimer) enemy.summonTimer = enemy.typeDef.behavior?.summonInterval || 4;
    enemy.summonTimer -= dt;
  },
};
