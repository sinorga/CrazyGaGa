import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { WaveSpawner } from './spawner.js';
import { WeaponManager } from './weapons.js';
import { Pickup } from './pickup.js';
import { SpatialHash, circlesOverlap, distance } from './collision.js';
import { ParticleSystem } from './particles.js';
import { getRandomSkillChoices, getSkillDefinition } from './data/skills.js';
import { getEnemyType, getBossForPhase } from './data/enemies.js';
import { updateBossAI } from './boss.js';
import { canEvolve, getEvolutionRecipe } from './data/evolutions.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);

    this.state = 'menu'; // 'menu' | 'playing' | 'levelup' | 'gameover'
    this.elapsed = 0;

    // Entities
    this.player = new Player(CONFIG.map.width / 2, CONFIG.map.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.pickups = [];

    // Systems
    this.spawner = new WaveSpawner();
    this.weaponManager = new WeaponManager();
    this.spatialHash = new SpatialHash();
    this.particles = new ParticleSystem();

    // Camera
    this.camera = { x: 0, y: 0 };

    // UI state
    this.skillChoices = [];
    this.autoAttackDelay = 0;

    // Boss state
    this.currentBoss = null;
    this.bossPhase = 0;
    this.bossSpawnTimer = CONFIG.waves.bossInterval;

    // Damage events for renderer
    this.onPlayerDamage = null; // callback: (isBoss) => {}

    // Give player starting weapon
    this._startingWeapon = 'arrow';
  }

  startGame() {
    this.state = 'playing';
    this.elapsed = 0;
    this.player.reset(CONFIG.map.width / 2, CONFIG.map.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.pickups = [];
    this.spawner.reset();
    this.weaponManager.reset();
    this.weaponManager.addWeapon(this._startingWeapon);
    this.currentBoss = null;
    this.bossPhase = 0;
    this.bossSpawnTimer = CONFIG.waves.bossInterval;
    this.particles = new ParticleSystem();
    this.skillChoices = [];
    this.autoAttackDelay = 0;
  }

  restart() {
    this.startGame();
  }

  triggerLevelUp() {
    if (this.state !== 'playing') return;
    this.state = 'levelup';

    // Check for evolution eligibility
    const evolutionChoices = [];
    for (const weapon of this.weaponManager.weapons) {
      if (weapon.evolved) continue;
      if (canEvolve(weapon.id, weapon.level, this.player.passiveStats)) {
        const recipe = getEvolutionRecipe(weapon.id);
        if (recipe) {
          evolutionChoices.push({
            id: recipe.evolvedWeaponId,
            name: recipe.name,
            description: recipe.description,
            icon: '✨',
            category: 'evolution',
            baseWeaponId: recipe.baseWeaponId,
            evolvedWeaponId: recipe.evolvedWeaponId,
          });
        }
      }
    }

    if (evolutionChoices.length > 0) {
      // Offer evolutions as priority choices
      this.skillChoices = evolutionChoices.slice(0, CONFIG.leveling.choiceCount);
    } else {
      this.skillChoices = getRandomSkillChoices(
        CONFIG.leveling.choiceCount,
        this.player.skillLevels
      );
    }
  }

  selectSkill(index) {
    if (this.state !== 'levelup') return;
    const skill = this.skillChoices[index];
    if (!skill) return;

    // Apply skill
    this.player.skillLevels[skill.id] = (this.player.skillLevels[skill.id] || 0) + 1;

    if (skill.category === 'evolution') {
      // Replace base weapon with evolved form
      this.weaponManager.weapons = this.weaponManager.weapons.filter(w => w.id !== skill.baseWeaponId);
      this.weaponManager.addWeapon(skill.evolvedWeaponId);
    } else if (skill.category === 'weapon') {
      this.weaponManager.addWeapon(skill.weaponId);
    } else if (skill.category === 'passive') {
      this.player.applyPassive(skill.stat, skill.value, skill.valueType);
    }

    // Perform level up
    this.player.levelUp();
    this.state = 'playing';

    // Check if player can level up again
    if (this.player.shouldLevelUp()) {
      this.triggerLevelUp();
    }
  }

  triggerGameOver() {
    this.state = 'gameover';
  }

  // Called by game loop each fixed timestep
  updatePlaying(dt) {
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.input.update();

    const isMoving = this.input.isMoving;

    // Player movement
    if (isMoving) {
      this.player.move(this.input.direction, dt);
      this.autoAttackDelay = CONFIG.combat.autoAttackDelay;
    } else {
      this.autoAttackDelay = Math.max(0, this.autoAttackDelay - dt);
    }

    this.player.update(dt);

    // Boss spawn timer
    if (!this.currentBoss) {
      this.bossSpawnTimer -= dt;
      if (this.bossSpawnTimer <= 0) {
        this.bossPhase++;
        const bossDef = getBossForPhase(this.bossPhase);
        if (bossDef) {
          const angle = Math.random() * Math.PI * 2;
          const dist = CONFIG.waves.spawnDistanceMin;
          const bx = this.player.x + Math.cos(angle) * dist;
          const by = this.player.y + Math.sin(angle) * dist;
          this.currentBoss = new Enemy(bx, by, bossDef);
          this.enemies.push(this.currentBoss);
        }
        this.bossSpawnTimer = CONFIG.waves.bossInterval;
      }
    }

    // Wave spawning (paused during boss fight)
    if (!this.currentBoss) {
      const newEnemies = this.spawner.update(dt, this.player, this.enemies.length);
      this.enemies.push(...newEnemies);
    }

    // Weapon updates
    const canAttack = !isMoving && this.autoAttackDelay <= 0;
    this.weaponManager.update(dt, this.player, this.enemies, this.projectiles, isMoving && !canAttack);

    // Update enemies
    const spawnedMinions = [];
    for (const enemy of this.enemies) {
      if (enemy.type === 'boss') {
        updateBossAI(enemy, this.player, dt, this.enemyProjectiles, spawnedMinions);
      } else {
        enemy.update(this.player, dt, this.enemyProjectiles, spawnedMinions);
      }
    }
    if (spawnedMinions.length > 0) {
      this.enemies.push(...spawnedMinions);
    }

    // Update projectiles
    for (const proj of this.projectiles) {
      proj.update(dt);
      proj.checkBounds(this.canvas.width, this.canvas.height, this.camera);
    }

    // Update enemy projectiles
    for (const proj of this.enemyProjectiles) {
      if (proj.alive) {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        // Bounds check
        const margin = 100;
        if (proj.x < this.camera.x - margin || proj.x > this.camera.x + this.canvas.width + margin ||
            proj.y < this.camera.y - margin || proj.y > this.camera.y + this.canvas.height + margin) {
          proj.alive = false;
        }
      }
    }

    // Update pickups
    for (const pickup of this.pickups) {
      if (pickup.update(dt, this.player)) {
        // Collected
        this.player.addExp(pickup.value);
        this.particles.emit(pickup.x, pickup.y, 3, pickup.color, { speedMax: 50, lifetime: 0.3 });

        // Check level up
        if (this.player.shouldLevelUp()) {
          this.triggerLevelUp();
          return; // pause updates
        }
      }
    }

    // Collision detection
    this._processCollisions();

    // Update particles
    this.particles.update(dt);

    // Update weapon area effects
    this._updateAreaEffects(dt);

    // Update camera
    this._updateCamera(dt);

    // Clean up dead entities
    this.enemies = this.enemies.filter(e => e.alive);
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.alive);
    this.pickups = this.pickups.filter(p => p.alive);

    // Check player death
    if (!this.player.alive) {
      this.triggerGameOver();
    }
  }

  _processCollisions() {
    // Build spatial hash with enemies
    this.spatialHash.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.alive) {
        e._idx = i; // temp index for hit tracking
        this.spatialHash.insert(e);
      }
    }

    // Player projectiles vs enemies
    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      const nearby = this.spatialHash.query(proj.x, proj.y, proj.radius + 30);
      for (const enemy of nearby) {
        if (!enemy.alive || proj.hasHit(enemy._idx)) continue;
        if (circlesOverlap(proj, enemy)) {
          enemy.takeDamage(proj.damage);
          proj.markHit(enemy._idx);
          proj.onHit();

          this.particles.emit(enemy.x, enemy.y, 4, enemy.color, { speedMax: 80, lifetime: 0.2 });

          if (!enemy.alive) {
            this._onEnemyDeath(enemy);
          }
          if (!proj.alive) break;
        }
      }
    }

    // Orbit weapon vs enemies
    for (const weapon of this.weaponManager.weapons) {
      if (weapon.type === 'orbit' && weapon.orbs) {
        for (const orb of weapon.orbs) {
          const nearby = this.spatialHash.query(orb.x, orb.y, orb.radius + 30);
          for (const enemy of nearby) {
            if (!enemy.alive) continue;
            if (circlesOverlap(orb, enemy)) {
              // Check hit cooldown
              if (!enemy._orbHitTimers) enemy._orbHitTimers = {};
              const key = weapon.id;
              if (enemy._orbHitTimers[key] && enemy._orbHitTimers[key] > 0) continue;
              enemy._orbHitTimers[key] = weapon.config.hitCooldown;

              enemy.takeDamage(orb.damage);
              this.particles.emit(enemy.x, enemy.y, 3, weapon.color, { speedMax: 60, lifetime: 0.15 });

              if (!enemy.alive) {
                this._onEnemyDeath(enemy);
              }
            }
          }
        }
      }
    }

    // Enemies vs player
    if (!this.player.invincible) {
      const nearPlayer = this.spatialHash.query(this.player.x, this.player.y, this.player.radius + 30);
      for (const enemy of nearPlayer) {
        if (!enemy.alive) continue;
        if (circlesOverlap(this.player, enemy)) {
          this.player.takeDamage(enemy.damage);
          this.particles.emit(this.player.x, this.player.y, 6, '#ff4444', { speedMax: 100, lifetime: 0.3 });
          if (this.onPlayerDamage) this.onPlayerDamage(enemy.type === 'boss');
          break;
        }
      }
    }

    // Enemy projectiles vs player
    if (!this.player.invincible) {
      for (const proj of this.enemyProjectiles) {
        if (!proj.alive) continue;
        const dx = proj.x - this.player.x;
        const dy = proj.y - this.player.y;
        const dist = dx * dx + dy * dy;
        const minDist = proj.radius + this.player.radius;
        if (dist < minDist * minDist) {
          this.player.takeDamage(proj.damage);
          proj.alive = false;
          this.particles.emit(this.player.x, this.player.y, 6, '#ff4444', { speedMax: 100, lifetime: 0.3 });
          if (this.onPlayerDamage) this.onPlayerDamage(false);
        }
      }
    }

    // Update orb hit cooldowns
    for (const enemy of this.enemies) {
      if (enemy._orbHitTimers) {
        for (const key of Object.keys(enemy._orbHitTimers)) {
          enemy._orbHitTimers[key] -= 1 / 60; // fixed timestep
        }
      }
    }
  }

  _onEnemyDeath(enemy) {
    this.player.kills++;

    // Boss death: resume regular waves
    if (this.currentBoss === enemy) {
      this.currentBoss = null;
    }

    // Drop EXP gems
    this.pickups.push(new Pickup(enemy.x, enemy.y, enemy.exp));

    // Exploder death explosion
    if (enemy.type === 'exploder' && enemy.typeDef.behavior) {
      const b = enemy.typeDef.behavior;
      this.particles.emit(enemy.x, enemy.y, 15, b.explosionColor, {
        speedMax: 150, lifetime: 0.4, sizeMax: 8,
      });

      // Damage player if in range
      const d = distance(this.player, enemy);
      if (d < b.explosionRadius) {
        this.player.takeDamage(b.explosionDamage);
      }
    }

    // Death particles
    this.particles.emit(enemy.x, enemy.y, 8, enemy.color, { speedMax: 120, lifetime: 0.3 });
  }

  _updateAreaEffects(dt) {
    for (const weapon of this.weaponManager.weapons) {
      // Chain visual timer
      if (weapon.chainTimer !== undefined) {
        weapon.chainTimer -= dt;
        if (weapon.chainTimer <= 0) {
          weapon.chainTargets = null;
        }
      }

      // Area effects
      if (weapon.areas) {
        for (const area of weapon.areas) {
          area.timer -= dt;
          area.tickTimer -= dt;

          if (area.tickTimer <= 0) {
            area.tickTimer = area.tickRate;
            // Damage enemies in area
            for (const enemy of this.enemies) {
              if (!enemy.alive) continue;
              if (distance(area, enemy) < area.radius + enemy.radius) {
                enemy.takeDamage(area.damage);
                if (!enemy.alive) this._onEnemyDeath(enemy);
              }
            }
          }
        }
        weapon.areas = weapon.areas.filter(a => a.timer > 0);
      }
    }
  }

  _updateCamera(dt) {
    const targetX = this.player.x - this.canvas.width / 2;
    const targetY = this.player.y - this.canvas.height / 2;
    const lerp = CONFIG.camera.lerp;
    this.camera.x += (targetX - this.camera.x) * lerp;
    this.camera.y += (targetY - this.camera.y) * lerp;
  }

  // Handle click/tap events for UI
  handleClick(screenX, screenY) {
    if (this.state === 'menu') {
      this.startGame();
      return;
    }
    if (this.state === 'gameover') {
      this.restart();
      return;
    }
    if (this.state === 'levelup') {
      // Check which skill button was clicked — ignore taps outside buttons
      const buttonH = 80;
      const gap = 10;
      const totalH = this.skillChoices.length * (buttonH + gap);
      const startY = (this.canvas.height - totalH) / 2;

      for (let i = 0; i < this.skillChoices.length; i++) {
        const bx = this.canvas.width / 2 - 140;
        const by = startY + i * (buttonH + gap);
        if (screenX >= bx && screenX <= bx + 280 &&
            screenY >= by && screenY <= by + buttonH) {
          this.selectSkill(i);
          return;
        }
      }
      return; // tap outside buttons — do nothing, stay in levelup
    }
  }
}
