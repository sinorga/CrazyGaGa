import { CONFIG } from './config.js';
import { getConfig, getRandomSkillChoices, getSkillDef as getSkillDefinition, getEnemyType, getBossForPhase, getCharacterDef as getCharacterDefinition, getUpgradeDefs, getCharacterDefs, reloadCache } from './gameConfig.js';
import { createConfigEditorState, handleClick as ceHandleClick, handleScroll as ceHandleScroll, handleDrag as ceHandleDrag, buildFields as ceBuildFields, cleanup as ceCleanup } from './configEditor.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { WaveSpawner } from './spawner.js';
import { WeaponManager } from './weapons.js';
import { Pickup } from './pickup.js';
import { SpatialHash, circlesOverlap, distance } from './collision.js';
import { ParticleSystem } from './particles.js';
import { updateBossAI } from './boss.js';
import { canEvolve, getEvolutionRecipe } from './data/evolutions.js';
import { loadSettings, getDefaults, applyUserSettings } from './settings.js';
import { loadMeta, saveMeta, purchaseUpgrade, unlockCharacter, selectCharacter, getUpgradeBonus } from './meta.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);

    this.state = 'menu'; // 'menu' | 'shop' | 'characters' | 'config_editor' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'victory'
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
    this.nextBossKills = CONFIG.waves.bossKillThreshold;

    // Damage events for renderer
    this.onPlayerDamage = null; // callback: (isBoss) => {}
    this.onLevelUpFlash = null; // callback: () => {}

    // Boss entrance effect
    this.bossEntrance = null; // { timer, bossName }

    // Meta progression
    this.meta = loadMeta();
    this.runGold = 0;
    this.goldRateMultiplier = 1;

    // Config editor state (lazy-initialized)
    this.configEditorState = null;

    // Give player starting weapon
    this._startingWeapon = 'arrow';
  }

  startGame() {
    reloadCache(); // apply any config overrides before run starts
    this.state = 'playing';
    this.elapsed = 0;
    this.runGold = 0;
    this.meta = loadMeta();
    this.player.reset(CONFIG.map.width / 2, CONFIG.map.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.pickups = [];
    this.spawner.reset();
    this.weaponManager.reset();

    // Apply character stats
    const charDef = getCharacterDefinition(this.meta.selected);
    if (charDef) {
      this.player.maxHp = charDef.baseStats.maxHp;
      this.player.hp = charDef.baseStats.maxHp;
      this.player.speed = charDef.baseStats.speed;
      this.player.icon = charDef.icon || '🗡️';
      CONFIG.player.color = charDef.color;
      this._startingWeapon = charDef.startingWeapon;
    }

    // Apply permanent upgrades
    const hpBonus = getUpgradeBonus(this.meta, 'maxHp');
    this.player.maxHp += hpBonus.flat;
    this.player.hp = this.player.maxHp;

    const speedBonus = getUpgradeBonus(this.meta, 'speed');
    this.player.speed += speedBonus.flat;

    const dmgBonus = getUpgradeBonus(this.meta, 'damage');
    this.player.damageMultiplier = 1 + dmgBonus.percent;

    const armorBonus = getUpgradeBonus(this.meta, 'armor');
    this.player.armor = armorBonus.flat;

    const expBonus = getUpgradeBonus(this.meta, 'exp');
    this.player.expMultiplier = 1 + expBonus.percent;

    const goldBonus = getUpgradeBonus(this.meta, 'goldRate');
    this.goldRateMultiplier = 1 + goldBonus.percent;

    this.weaponManager.addWeapon(this._startingWeapon);
    // Apply cooldown multiplier from settings
    const cdMult = (loadSettings() || getDefaults()).cooldownMultiplier ?? 1.0;
    if (cdMult !== 1.0) {
      for (const w of this.weaponManager.weapons) {
        w.cooldown *= cdMult;
      }
    }
    this.currentBoss = null;
    this.bossPhase = 0;
    this.nextBossKills = CONFIG.waves.bossKillThreshold;
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

    // Golden celebration burst
    this.particles.emit(this.player.x, this.player.y, 20, '#ffdd44', {
      speedMin: 50, speedMax: 150, sizeMin: 3, sizeMax: 7, lifetime: 0.8, gravity: -30,
    });
    if (this.onLevelUpFlash) this.onLevelUpFlash();

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
    this.meta.gold += Math.floor(this.runGold);
    saveMeta(this.meta);
  }

  triggerVictory() {
    this.state = 'victory';
    this.runGold *= 2; // double gold reward for winning
    this.meta.gold += Math.floor(this.runGold);
    saveMeta(this.meta);
  }

  // Called by game loop each fixed timestep
  updatePlaying(dt) {
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.input.update();

    const isMoving = this.input.isMoving;
    const fireWhileMoving = CONFIG.combat.fireWhileMoving;

    // Player movement
    if (isMoving) {
      this.player.move(this.input.direction, dt);
      if (!fireWhileMoving) this.autoAttackDelay = CONFIG.combat.autoAttackDelay;
    } else {
      this.autoAttackDelay = Math.max(0, this.autoAttackDelay - dt);
    }

    this.player.update(dt);

    // Boss entrance timer
    if (this.bossEntrance) {
      this.bossEntrance.timer -= dt;
      if (this.bossEntrance.timer <= 0) {
        this.bossEntrance = null;
      }
    }

    // Boss spawn on kill threshold
    if (!this.currentBoss && this.player.kills >= this.nextBossKills) {
      this.bossPhase++;
      const bossDef = getBossForPhase(this.bossPhase);
      if (bossDef) {
        const angle = Math.random() * Math.PI * 2;
        const dist = CONFIG.waves.spawnDistanceMin;
        const bx = this.player.x + Math.cos(angle) * dist;
        const by = this.player.y + Math.sin(angle) * dist;
        this.currentBoss = new Enemy(bx, by, bossDef);
        this.enemies.push(this.currentBoss);
        this.bossEntrance = { timer: 1.2, bossName: bossDef.name };
      }
      this.nextBossKills += CONFIG.waves.bossKillThreshold;
    }

    // Wave spawning (reduced during boss fight, not paused)
    const newEnemies = this.spawner.update(dt, this.player, this.enemies.length);
    this.enemies.push(...newEnemies);

    // Weapon updates
    const canAttack = (fireWhileMoving || !isMoving) && this.autoAttackDelay <= 0;
    this.weaponManager.update(dt, this.player, this.enemies, this.projectiles, !canAttack);

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

    // Check victory
    if (this.player.kills >= CONFIG.waves.victoryKills) {
      this.triggerVictory();
      return;
    }

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

          const dmg = Math.round(proj.damage);
          const dmgColor = dmg >= 50 ? '#ffdd44' : '#ffffff';
          const dmgSize = Math.min(20, 12 + Math.floor(dmg / 10));
          this.particles.emitText(enemy.x, enemy.y - enemy.radius, dmg, dmgColor, { fontSize: dmgSize });
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
              const orbDmg = Math.round(orb.damage);
              this.particles.emitText(enemy.x, enemy.y - enemy.radius, orbDmg, '#ffffff', { fontSize: 12 });
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
          this.particles.emitText(this.player.x, this.player.y - this.player.radius, Math.round(enemy.damage), '#ff4444', { fontSize: 16 });
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
          this.particles.emitText(this.player.x, this.player.y - this.player.radius, Math.round(proj.damage), '#ff4444', { fontSize: 16 });
          proj.alive = false;
          this.particles.emit(this.player.x, this.player.y, 6, '#ff4444', { speedMax: 100, lifetime: 0.3 });
          if (this.onPlayerDamage) this.onPlayerDamage(false);
        }
      }
    }

    // Orbs vs enemy projectiles — orbs destroy enemy bullets
    for (const weapon of this.weaponManager.weapons) {
      if (weapon.type === 'orbit' && weapon.orbs) {
        for (const orb of weapon.orbs) {
          for (const proj of this.enemyProjectiles) {
            if (!proj.alive) continue;
            const dx = orb.x - proj.x;
            const dy = orb.y - proj.y;
            const dist = dx * dx + dy * dy;
            const minDist = orb.radius + proj.radius;
            if (dist < minDist * minDist) {
              proj.alive = false;
              this.particles.emit(proj.x, proj.y, 3, orb.color, { speedMax: 60, lifetime: 0.2 });
            }
          }
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
    this.runGold += (CONFIG.meta?.goldPerKill ?? 1) * this.goldRateMultiplier;

    // Boss death: bonus gold + EXP + celebration
    if (this.currentBoss === enemy) {
      this.currentBoss = null;
      this.runGold += 50 * this.goldRateMultiplier; // boss bonus gold
      this.particles.emit(enemy.x, enemy.y, 30, '#ffdd44', {
        speedMin: 80, speedMax: 200, sizeMin: 4, sizeMax: 8, lifetime: 1.0, gravity: -20,
      });
      this.particles.emitText(enemy.x, enemy.y - 40, '+50g', '#ffdd44', { fontSize: 20, lifetime: 1.2 });
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
      // Row of 3 buttons: 商店, 角色, 設定
      const btnW = 90;
      const btnH = 40;
      const gap = 15;
      const totalW = btnW * 3 + gap * 2;
      const startX = this.canvas.width / 2 - totalW / 2;
      const btnY = Math.round(this.canvas.height * 0.38) + 140;

      // Shop button
      if (screenX >= startX && screenX <= startX + btnW &&
          screenY >= btnY && screenY <= btnY + btnH) {
        this.meta = loadMeta();
        this.state = 'shop';
        return;
      }
      // Characters button
      const charX = startX + btnW + gap;
      if (screenX >= charX && screenX <= charX + btnW &&
          screenY >= btnY && screenY <= btnY + btnH) {
        this.meta = loadMeta();
        this.state = 'characters';
        return;
      }
      // Settings / Config editor button
      const setX = startX + (btnW + gap) * 2;
      if (screenX >= setX && screenX <= setX + btnW &&
          screenY >= btnY && screenY <= btnY + btnH) {
        this.configEditorState = createConfigEditorState();
        this.state = 'config_editor';
        return;
      }
      this.startGame();
      return;
    }
    if (this.state === 'config_editor') {
      ceHandleClick(this.configEditorState, screenX, screenY, this.canvas, () => {
        ceCleanup(this.configEditorState);
        this.state = 'menu';
      });
      return;
    }
    if (this.state === 'shop') {
      this._handleShopClick(screenX, screenY);
      return;
    }
    if (this.state === 'characters') {
      this._handleCharactersClick(screenX, screenY);
      return;
    }
    if (this.state === 'playing') {
      // Pause button (top-right, 40x40)
      const pauseBtnX = this.canvas.width - 50;
      const pauseBtnY = 10;
      if (screenX >= pauseBtnX && screenX <= pauseBtnX + 40 &&
          screenY >= pauseBtnY && screenY <= pauseBtnY + 40) {
        this.state = 'paused';
        return;
      }
      return;
    }
    if (this.state === 'paused') {
      this._handlePausedClick(screenX, screenY);
      return;
    }
    if (this.state === 'gameover') {
      this.restart();
      return;
    }
    if (this.state === 'victory') {
      this.state = 'menu';
      return;
    }
    if (this.state === 'levelup') {
      // Horizontal card layout — match renderer positions
      const count = this.skillChoices.length;
      const gap = 10;
      const cardW = Math.min(140, (this.canvas.width - gap * (count + 1)) / count);
      const cardH = 120;
      const totalW = count * cardW + (count - 1) * gap;
      const startX = (this.canvas.width - totalW) / 2;
      const cardY = this.canvas.height * 0.22;

      for (let i = 0; i < count; i++) {
        const bx = startX + i * (cardW + gap);
        if (screenX >= bx && screenX <= bx + cardW &&
            screenY >= cardY && screenY <= cardY + cardH) {
          this.selectSkill(i);
          return;
        }
      }
      return; // tap outside cards — do nothing, stay in levelup
    }
  }

  _handleShopClick(screenX, screenY) {
    // Back button (top-left)
    if (screenX < 80 && screenY < 50) {
      this.state = 'menu';
      return;
    }

    // Purchase upgrade buttons — match renderer layout
    const rowH = 60;
    const startY = 100;
    const btnW = 60;
    const btnH = 30;
    const btnX = this.canvas.width / 2 + 80;

    const upgradeDefs = getUpgradeDefs();
    for (let i = 0; i < upgradeDefs.length; i++) {
      const by = startY + i * rowH + 15;
      if (screenX >= btnX && screenX <= btnX + btnW &&
          screenY >= by && screenY <= by + btnH) {
        purchaseUpgrade(this.meta, upgradeDefs[i].id);
        return;
      }
    }
  }

  _handleCharactersClick(screenX, screenY) {
    // Back button (top-left)
    if (screenX < 80 && screenY < 50) {
      this.state = 'menu';
      return;
    }

    // Character cards — match renderer layout
    const cardH = 100;
    const gap = 15;
    const startY = 100;
    const charDefs = getCharacterDefs();

    for (let i = 0; i < charDefs.length; i++) {
      const cy = startY + i * (cardH + gap);
      if (screenY >= cy && screenY <= cy + cardH) {
        const charDef = charDefs[i];
        if (this.meta.unlocked.includes(charDef.id)) {
          selectCharacter(this.meta, charDef.id);
        } else {
          unlockCharacter(this.meta, charDef.id);
        }
        return;
      }
    }
  }

  _handlePausedClick(screenX, screenY) {
    const cx = this.canvas.width / 2;
    const btnW = 180;
    const btnH = 50;
    const btnX = cx - btnW / 2;

    // Resume button
    const resumeY = this.canvas.height / 2 - 10;
    if (screenX >= btnX && screenX <= btnX + btnW &&
        screenY >= resumeY && screenY <= resumeY + btnH) {
      this.state = 'playing';
      return;
    }

    // Exit button
    const exitY = this.canvas.height / 2 + 60;
    if (screenX >= btnX && screenX <= btnX + btnW &&
        screenY >= exitY && screenY <= exitY + btnH) {
      this.state = 'menu';
      return;
    }
  }

  handleSettingsDrag(screenX, screenY) {
    if (this.state === 'config_editor' && this.configEditorState) {
      ceHandleDrag(this.configEditorState, screenX, screenY, this.canvas);
    }
  }

  handleSettingsScroll(deltaY) {
    if (this.state === 'config_editor' && this.configEditorState) {
      ceHandleScroll(this.configEditorState, deltaY, this.canvas);
    }
  }
}
