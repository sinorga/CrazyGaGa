import { Enemy } from './enemy.js';
import { getEnemyType } from './data/enemies.js';

export const bossAttacks = {
  charge(boss, playerPos, dt, attack) {
    const dx = playerPos.x - boss.x;
    const dy = playerPos.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      boss.x += (dx / dist) * attack.speed * dt;
      boss.y += (dy / dist) * attack.speed * dt;
    }
  },

  bullet_ring(boss, playerPos, attack, projectiles) {
    const count = attack.count || 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      projectiles.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * attack.speed,
        vy: Math.sin(angle) * attack.speed,
        radius: 5,
        color: boss.color,
        damage: boss.damage,
        isEnemy: true,
        alive: true,
      });
    }
  },

  bullet_spiral(boss, playerPos, attack, projectiles) {
    if (!boss._spiralAngle) boss._spiralAngle = 0;
    const count = attack.count || 20;
    for (let i = 0; i < count; i++) {
      const angle = boss._spiralAngle + (i / count) * Math.PI * 2;
      projectiles.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * attack.speed,
        vy: Math.sin(angle) * attack.speed,
        radius: 5,
        color: boss.color,
        damage: boss.damage,
        isEnemy: true,
        alive: true,
      });
    }
    boss._spiralAngle += 0.3;
  },

  teleport(boss, playerPos, attack) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 100;
    boss.x = playerPos.x + Math.cos(angle) * dist;
    boss.y = playerPos.y + Math.sin(angle) * dist;
  },

  summon(boss, playerPos, attack, spawnedMinions) {
    const minionType = getEnemyType(attack.summonId);
    if (!minionType) return;
    for (let i = 0; i < (attack.count || 3); i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      const mx = boss.x + Math.cos(angle) * dist;
      const my = boss.y + Math.sin(angle) * dist;
      spawnedMinions.push(new Enemy(mx, my, minionType));
    }
  },
};

export function updateBossAI(boss, playerPos, dt, projectiles, spawnedMinions) {
  if (!boss.alive) return;

  // Initialize attack state
  if (!boss._attackCooldowns) {
    boss._attackCooldowns = {};
    for (const atk of boss.typeDef.attacks) {
      boss._attackCooldowns[atk.type] = 0;
    }
  }
  if (boss._currentAttack === undefined) boss._currentAttack = null;
  if (boss._attackTimer === undefined) boss._attackTimer = 0;

  // Decrement cooldowns
  for (const key of Object.keys(boss._attackCooldowns)) {
    boss._attackCooldowns[key] = Math.max(0, boss._attackCooldowns[key] - dt);
  }

  // If currently performing an attack with duration (like charge)
  if (boss._currentAttack) {
    const atk = boss._currentAttack;
    boss._attackTimer -= dt;
    if (atk.type === 'charge') {
      bossAttacks.charge(boss, playerPos, dt, atk);
    }
    if (boss._attackTimer <= 0) {
      boss._attackCooldowns[atk.type] = atk.cooldown;
      boss._currentAttack = null;
    }
    return;
  }

  // Try to start a new attack
  for (const atk of boss.typeDef.attacks) {
    if (boss._attackCooldowns[atk.type] <= 0) {
      if (atk.type === 'charge') {
        boss._currentAttack = atk;
        boss._attackTimer = atk.duration;
      } else if (atk.type === 'bullet_ring') {
        bossAttacks.bullet_ring(boss, playerPos, atk, projectiles);
        boss._attackCooldowns[atk.type] = atk.cooldown;
      } else if (atk.type === 'bullet_spiral') {
        bossAttacks.bullet_spiral(boss, playerPos, atk, projectiles);
        boss._attackCooldowns[atk.type] = atk.cooldown;
      } else if (atk.type === 'teleport') {
        bossAttacks.teleport(boss, playerPos, atk);
        boss._attackCooldowns[atk.type] = atk.cooldown;
      } else if (atk.type === 'summon') {
        bossAttacks.summon(boss, playerPos, atk, spawnedMinions);
        boss._attackCooldowns[atk.type] = atk.cooldown;
      }
      return; // one attack per update
    }
  }

  // Default: move slowly toward player
  const dx = playerPos.x - boss.x;
  const dy = playerPos.y - boss.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    boss.x += (dx / dist) * boss.speed * dt;
    boss.y += (dy / dist) * boss.speed * dt;
  }
}
