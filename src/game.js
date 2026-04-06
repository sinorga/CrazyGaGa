import { CONFIG } from './config.js';
import { getConfig, getRandomSkillChoices, getSkillDef as getSkillDefinition, getEnemyType, getBossForPhase, getCharacterDef as getCharacterDefinition, getUpgradeDefs, getCharacterDefs, reloadCache } from './gameConfig.js';
import { createConfigEditorState, handleClick as ceHandleClick, handleScroll as ceHandleScroll, handleDrag as ceHandleDrag, buildFields as ceBuildFields, cleanup as ceCleanup } from './configEditor.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy, isBlockedByShielder } from './enemy.js';
import { RoomManager } from './roomManager.js';
import { WaveSpawner } from './spawner.js';
import { WeaponManager } from './weapons.js';
import { Pickup } from './pickup.js';
import { Chest } from './chest.js';
import { Barrel } from './barrel.js';
import { SpatialHash, circlesOverlap, distance } from './collision.js';
import { ParticleSystem } from './particles.js';
import { updateBossAI } from './boss.js';
import { canEvolve, getEvolutionRecipe } from './data/evolutions.js';
import { loadSettings, getDefaults, applyUserSettings } from './settings.js';
import { loadMeta, saveMeta, purchaseUpgrade, unlockCharacter, selectCharacter, getUpgradeBonus, isChapterUnlocked, clearChapter } from './meta.js';
import { CHAPTERS } from './data/chapters.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);

    this.state = 'menu'; // 'menu' | 'shop' | 'characters' | 'config_editor' | 'chapter_select' | 'playing' | 'paused' | 'levelup' | 'roomclear' | 'chapterclear' | 'gameover' | 'victory'
    this.mode = 'archero'; // 'archero' | 'survivor'
    this.elapsed = 0;

    // Entities
    this.player = new Player(canvas.width / 2, canvas.height * 0.8);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.pickups = [];
    this.chests = [];
    this.barrels = [];

    // Systems
    this.roomManager = new RoomManager();
    this.spawner = new WaveSpawner();
    this.weaponManager = new WeaponManager();
    this.spatialHash = new SpatialHash();
    this.particles = new ParticleSystem();

    // Camera: fixed for archero (with door-nudge), scrolling for survivor
    this.camera = { x: 0, y: 0 };
    this._doorNudgeY = 0; // archero: smooth Y offset toward door when open

    // Survivor state
    this.nextBossKills = 0;
    this.bossPhase = 0;

    // UI state
    this.skillChoices = [];
    this.autoAttackDelay = 0;
    this._prevState = null; // state before roomclear (to handle advance)

    // Boss state
    this.currentBoss = null;

    // Damage events for renderer
    this.onPlayerDamage = null; // callback: (isBoss) => {}
    this.onLevelUpFlash = null; // callback: () => {}

    // Boss entrance effect
    this.bossEntrance = null; // { timer, bossName }

    // Chapter clear data
    this.chapterClearNum = 0;

    // Player silence (boss_lich_king ability)
    this.silenceTimer = 0;

    // Meta progression
    this.meta = loadMeta();
    this.runGold = 0;
    this.goldRateMultiplier = 1;

    // Config editor state (lazy-initialized)
    this.configEditorState = null;

    // Give player starting weapon
    this._startingWeapon = 'arrow';
  }

  // Used by RoomManager to look up enemy type definitions
  _getEnemyType(id) {
    return getEnemyType(id);
  }

  startGame(mode = 'archero') {
    this.mode = mode;
    reloadCache(); // apply any config overrides before run starts
    this.state = 'playing';
    this.elapsed = 0;
    this.runGold = 0;
    this.meta = loadMeta();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.pickups = [];
    this.chests = [];
    this.barrels = [];
    this.silenceTimer = 0;
    this.weaponManager.reset();

    // Reset player stats (position will be set per-mode below)
    this.player.reset(0, 0);

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
    this.particles = new ParticleSystem();
    this.skillChoices = [];
    this.autoAttackDelay = 0;
    this._prevState = null;

    if (mode === 'archero') {
      const cfg = getConfig();
      this.player.reset(this.canvas.width / 2, this.canvas.height * cfg.room.playerStartYFraction);
      this.camera = { x: 0, y: 0 };
      this._doorNudgeY = 0;
      this.roomManager.reset();
      // Start at the chosen chapter (default 0)
      this.roomManager.chapterIndex = this._startChapterIndex ?? 0;
      const initialEnemies = this.roomManager.enterRoom(this);
      this.enemies.push(...initialEnemies);
      this._spawnRoomObjects();
    } else {
      // Survivor mode
      const cfg = getConfig();
      this.player.reset(cfg.map.width / 2, cfg.map.height / 2);
      this.camera = {
        x: cfg.map.width / 2 - this.canvas.width / 2,
        y: cfg.map.height / 2 - this.canvas.height / 2,
      };
      this.spawner.reset();
      this.nextBossKills = cfg.waves.bossKillThreshold;
      this.bossPhase = 0;
    }
  }

  restart() {
    this.startGame(this.mode);
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
      this.skillChoices = evolutionChoices.slice(0, getConfig().leveling.choiceCount);
    } else {
      // Level-up pool: passive stat boosts only
      this.skillChoices = getRandomSkillChoices(
        getConfig().leveling.choiceCount,
        this.player.skillLevels,
        'levelup'
      );
    }
  }

  triggerRoomClear() {
    if (this.state !== 'playing') return;
    this._prevState = 'roomclear';
    this.state = 'roomclear';
    this.skillChoices = getRandomSkillChoices(
      getConfig().leveling.choiceCount,
      this.player.skillLevels,
      'archero'
    );
  }

  triggerChapterClear() {
    if (this.state !== 'playing') return;
    const clearedIndex = this.roomManager.chapterIndex;
    this.chapterClearNum = this.roomManager.currentChapter.id;
    this.state = 'chapterclear';
    this.meta.gold += Math.floor(this.runGold);
    clearChapter(this.meta, clearedIndex); // unlock next chapter
    saveMeta(this.meta);
  }

  selectSkill(index) {
    const isRoomClear = this.state === 'roomclear';
    const isLevelUp = this.state === 'levelup';
    if (!isLevelUp && !isRoomClear) return;
    const skill = this.skillChoices[index];
    if (!skill) return;

    // Apply skill
    this.player.skillLevels[skill.id] = (this.player.skillLevels[skill.id] || 0) + 1;

    if (skill.category === 'evolution') {
      this.weaponManager.weapons = this.weaponManager.weapons.filter(w => w.id !== skill.baseWeaponId);
      this.weaponManager.addWeapon(skill.evolvedWeaponId);
    } else if (skill.category === 'weapon') {
      this.weaponManager.addWeapon(skill.weaponId);
    } else if (skill.category === 'passive' || skill.category === 'weapon_modifier') {
      if (skill.stat) {
        this.player.applyPassive(skill.stat, skill.value, skill.valueType);
      }
    }

    if (isLevelUp) {
      this.player.levelUp();
      this.state = 'playing';
      if (this.player.shouldLevelUp()) {
        this.triggerLevelUp();
      }
    } else {
      // Room clear: advance to next room after ability selection
      this.state = 'playing';
      this.roomManager.advanceRoom(this);
      this._spawnRoomObjects();
    }
  }

  triggerGameOver() {
    this.state = 'gameover';
    this.meta.gold += Math.floor(this.runGold);
    saveMeta(this.meta);
  }

  // Helper: spawn chests and barrels for the current room
  _spawnRoomObjects() {
    this.chests = [];
    this.barrels = [];
    this._doorBurstEmitted = false;
    const template = this.roomManager.currentTemplate;
    if (!template) return;

    // Treasure room: spawn a chest at center
    if (template.type === 'treasure') {
      this.chests.push(new Chest(this.canvas.width / 2, this.canvas.height / 2));
    }

    // Barrels from obstacle positions
    for (const obs of (template.obstacles || [])) {
      const x = obs.x * this.canvas.width;
      const y = obs.y * this.canvas.height;
      this.barrels.push(new Barrel(x, y));
    }
  }

  // Called by game loop each fixed timestep
  updatePlaying(dt) {
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.input.update();

    const cfg = getConfig();
    const isMoving = this.input.isMoving;
    const fireWhileMoving = cfg.combat.fireWhileMoving;

    // Player movement
    if (isMoving) {
      if (this.mode === 'archero') {
        this.player.move(this.input.direction, dt, this.canvas.width, this.canvas.height);
      } else {
        this.player.move(this.input.direction, dt); // survivor: map bounds fallback
      }
      if (!fireWhileMoving) this.autoAttackDelay = cfg.combat.autoAttackDelay;
    } else {
      this.autoAttackDelay = Math.max(0, this.autoAttackDelay - dt);
    }

    this.player.update(dt);

    // Silence timer (boss_lich_king ability)
    if (this.silenceTimer > 0) this.silenceTimer -= dt;

    // Boss entrance timer
    if (this.bossEntrance) {
      this.bossEntrance.timer -= dt;
      if (this.bossEntrance.timer <= 0) {
        this.bossEntrance = null;
      }
    }

    if (this.mode === 'archero') {
      // Room manager update: spawns new wave enemies
      const newEnemies = this.roomManager.update(dt, this.enemies, this.player, this);
      if (newEnemies.length > 0) {
        this.enemies.push(...newEnemies);
        for (const e of newEnemies) {
          if (e.type === 'boss') {
            this.currentBoss = e;
            this.bossEntrance = { timer: 1.2, bossName: e.typeDef.name };
          }
        }
      }

      // Player-door overlap check (room cleared)
      if (this.roomManager.doorOpen && this.roomManager.doorAnim >= 1) {
        const door = this.roomManager.getDoorRect(this.canvas.width);
        if (this.player.x >= door.x && this.player.x <= door.x + door.w &&
            this.player.y >= door.y && this.player.y <= door.y + door.h) {
          this.roomManager.onPlayerReachDoor(this);
          return;
        }
      }
    } else {
      // Survivor: spawner update
      this.spawner.update(dt, this.enemies, this.player, (typeId, x, y) => {
        const typeDef = getEnemyType(typeId);
        if (!typeDef) return;
        const e = new Enemy(x, y, typeDef);
        this.enemies.push(e);
        if (e.type === 'boss') {
          this.currentBoss = e;
          this.bossEntrance = { timer: 1.2, bossName: typeDef.name };
        }
      });
      this._updateCamera(dt);
      if (this.player.kills >= cfg.waves.victoryKills) {
        this.triggerVictory();
        return;
      }
    }

    // Weapon updates (silence disables shooting)
    const canAttack = (fireWhileMoving || !isMoving) && this.autoAttackDelay <= 0 && this.silenceTimer <= 0;
    this.weaponManager.update(dt, this.player, this.enemies, this.projectiles, !canAttack);

    // Update enemies
    const spawnedMinions = [];
    for (const enemy of this.enemies) {
      // Provide canvas dimensions so enemy can clamp to room walls in archero mode
      if (this.mode === 'archero') {
        enemy._canvasW = this.canvas.width;
        enemy._canvasH = this.canvas.height;
      } else {
        enemy._canvasW = null;
        enemy._canvasH = null;
      }
      if (enemy.type === 'boss') {
        updateBossAI(enemy, this.player, dt, this.enemyProjectiles, spawnedMinions);
        // Phase transition check
        this._checkBossPhase(enemy);
      } else {
        enemy.update(this.player, dt, this.enemyProjectiles, spawnedMinions, this.enemies);
      }
    }
    if (spawnedMinions.length > 0) {
      this.enemies.push(...spawnedMinions);
    }

    // Update projectiles
    for (const proj of this.projectiles) {
      proj.update(dt, this.enemies);
      proj.checkBounds(this.canvas.width, this.canvas.height, this.camera);
    }

    // Update enemy projectiles
    for (const proj of this.enemyProjectiles) {
      if (proj.alive) {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        const margin = 100;
        if (proj.x < -margin || proj.x > this.canvas.width + margin ||
            proj.y < -margin || proj.y > this.canvas.height + margin) {
          proj.alive = false;
        }
      }
    }

    // Update pickups
    for (const pickup of this.pickups) {
      if (pickup.update(dt, this.player)) {
        // Collected
        if (pickup.type === 'hp') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + pickup.hpValue);
          this.particles.emit(pickup.x, pickup.y, 4, '#ff6680', { speedMax: 50, lifetime: 0.3 });
        } else {
          this.player.addExp(pickup.value);
          this.particles.emit(pickup.x, pickup.y, 3, pickup.color, { speedMax: 50, lifetime: 0.3 });
          if (this.player.shouldLevelUp()) {
            this.triggerLevelUp();
            return;
          }
        }
      }
    }

    // Update chests
    for (const chest of this.chests) {
      if (!chest.open) {
        const reward = chest.tryOpen(this.player);
        if (reward) {
          if (reward.type === 'hp') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + reward.value);
          } else if (reward.type === 'gold') {
            this.runGold += reward.value;
          } else if (reward.type === 'scroll') {
            this.triggerRoomClear(); // use archero ability pool
            return;
          }
          this.particles.emit(chest.x, chest.y, 15, '#ffdd44', { speedMax: 100, lifetime: 0.5 });
        }
      }
    }

    // Update barrels (just alive tracking; collisions handled below)
    // Barrels are static — no per-frame update needed

    // Collision detection
    this._processCollisions();

    // Update particles
    this.particles.update(dt);

    // Update weapon area effects
    this._updateAreaEffects(dt);

    // Clean up dead entities
    this.enemies = this.enemies.filter(e => e.alive);
    if (this.currentBoss && !this.currentBoss.alive) this.currentBoss = null;
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.alive);
    this.pickups = this.pickups.filter(p => p.alive);
    this.barrels = this.barrels.filter(b => b.alive);

    if (this.mode === 'archero') {
      const wasDoorOpen = this.roomManager.doorOpen;
      // Room clear check after deaths are processed
      this.roomManager.onEnemyDeath(this.enemies);

      if (this.roomManager.doorOpen && !wasDoorOpen) {
        // Room just cleared — clear all projectiles and magnetically attract pickups
        this.projectiles = [];
        this.enemyProjectiles = [];
        for (const pickup of this.pickups) {
          if (pickup.alive) {
            pickup.attracted = true;
            pickup.superMagnet = true;
          }
        }
      }

      // Camera nudge: when door is open, shift view up to make door visible
      const nudgeTarget = this.roomManager.doorOpen ? -60 : 0;
      this._doorNudgeY += (nudgeTarget - this._doorNudgeY) * 0.05;
      this.camera.y = this._doorNudgeY;

      // Room-clear door particle burst (once)
      if (this.roomManager.doorOpen && !this._doorBurstEmitted) {
        this._doorBurstEmitted = true;
        const door = this.roomManager.getDoorRect(this.canvas.width);
        this.particles.emit(door.x + door.w / 2, door.y + door.h / 2, 20, '#ffdd44', {
          speedMin: 50, speedMax: 150, sizeMin: 2, sizeMax: 6, lifetime: 0.8,
        });
      }
    }

    // Check player death
    if (!this.player.alive) {
      this.triggerGameOver();
    }
  }

  triggerVictory() {
    this.state = 'victory';
    this.meta.gold += Math.floor(this.runGold);
    saveMeta(this.meta);
  }

  _updateCamera(dt) {
    const cfg = getConfig();
    const lerp = cfg.camera.lerp;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const targetX = Math.max(0, Math.min(cfg.map.width - cw, this.player.x - cw / 2));
    const targetY = Math.max(0, Math.min(cfg.map.height - ch, this.player.y - ch / 2));
    this.camera.x += (targetX - this.camera.x) * lerp;
    this.camera.y += (targetY - this.camera.y) * lerp;
  }

  _checkBossPhase(boss) {
    if (boss._phaseTriggered) return;
    const phaseAt = boss.typeDef.phaseAt;
    if (!phaseAt) return;
    if (boss.hp / boss.maxHp <= phaseAt) {
      boss._phaseTriggered = true;
      boss._phaseColor = boss.color;
      boss.color = '#ff4400'; // red tint
      boss.speed = Math.round(boss.speed * 1.3);
      // Add extra attack if space
      this.particles.emit(boss.x, boss.y, 20, '#ff4400', { speedMax: 150, lifetime: 0.5 });
    }
  }

  _processCollisions() {
    // Build spatial hash with enemies
    this.spatialHash.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.alive) {
        e._idx = i;
        this.spatialHash.insert(e);
      }
    }

    // Player projectiles vs enemies
    for (const proj of this.projectiles) {
      if (!proj.alive) continue;

      // Projectile vs barrels
      for (const barrel of this.barrels) {
        if (!barrel.alive) continue;
        const dx = proj.x - barrel.x;
        const dy = proj.y - barrel.y;
        if (dx * dx + dy * dy < (proj.radius + barrel.radius) ** 2) {
          barrel.takeDamage(proj.damage);
          proj.alive = false;
          if (!barrel.alive) {
            this.particles.emit(barrel.x, barrel.y, 12, '#ff8844', { speedMax: 120, lifetime: 0.4 });
          }
          break;
        }
      }
      if (!proj.alive) continue;

      const nearby = this.spatialHash.query(proj.x, proj.y, proj.radius + 30);
      for (const enemy of nearby) {
        if (!enemy.alive || proj.hasHit(enemy._idx)) continue;
        if (circlesOverlap(proj, enemy)) {
          // Shielder: check if projectile is blocked by frontal arc
          if (isBlockedByShielder(proj, enemy)) continue;

          const dmgDealt = proj.damage;
          enemy.takeDamage(dmgDealt);
          proj.markHit(enemy._idx);
          proj.onHit();

          // Archero effects on hit
          if (this.player.freezeChance > 0 && Math.random() < this.player.freezeChance) {
            enemy.frozen = 1.2;
          }
          if (this.player.poisonDps > 0) {
            enemy.poisoned = 3;
            enemy.poisonDps = this.player.poisonDps;
          }
          if (this.player.vampire > 0) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + dmgDealt * this.player.vampire);
          }

          const dmg = Math.round(dmgDealt);
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

    // Enemies vs player contact + thorns
    if (!this.player.invincible) {
      const nearPlayer = this.spatialHash.query(this.player.x, this.player.y, this.player.radius + 30);
      for (const enemy of nearPlayer) {
        if (!enemy.alive) continue;
        if (circlesOverlap(this.player, enemy)) {
          const contactDmg = enemy.damage;
          this.player.takeDamage(contactDmg);
          this.particles.emitText(this.player.x, this.player.y - this.player.radius, Math.round(contactDmg), '#ff4444', { fontSize: 16 });
          this.particles.emit(this.player.x, this.player.y, 6, '#ff4444', { speedMax: 100, lifetime: 0.3 });
          if (this.onPlayerDamage) this.onPlayerDamage(enemy.type === 'boss');

          // Thorns: reflect damage back
          if (this.player.thorns > 0) {
            const reflected = contactDmg * this.player.thorns;
            enemy.takeDamage(reflected);
            if (!enemy.alive) this._onEnemyDeath(enemy);
          }
          break;
        }
      }
    }

    // Enemy projectiles vs player
    if (!this.player.invincible) {
      for (const proj of this.enemyProjectiles) {
        if (!proj.alive) continue;

        // Silence bolt: boss_lich_king
        if (proj.isSilence) {
          const dx = proj.x - this.player.x;
          const dy = proj.y - this.player.y;
          if (dx * dx + dy * dy < (proj.radius + this.player.radius) ** 2) {
            this.silenceTimer = proj.silenceDuration || 2;
            proj.alive = false;
            continue;
          }
        }

        const dx = proj.x - this.player.x;
        const dy = proj.y - this.player.y;
        const dist2 = dx * dx + dy * dy;
        const minDist = proj.radius + this.player.radius;
        if (dist2 < minDist * minDist) {
          this.player.takeDamage(proj.damage);
          this.particles.emitText(this.player.x, this.player.y - this.player.radius, Math.round(proj.damage), '#ff4444', { fontSize: 16 });
          proj.alive = false;
          this.particles.emit(this.player.x, this.player.y, 6, '#ff4444', { speedMax: 100, lifetime: 0.3 });
          if (this.onPlayerDamage) this.onPlayerDamage(false);
        }
      }
    }

    // Orbs vs enemy projectiles
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
          enemy._orbHitTimers[key] -= 1 / 60;
        }
      }
    }
  }

  _onEnemyDeath(enemy) {
    this.player.kills++;
    this.runGold += (getConfig().meta?.goldPerKill ?? 1) * this.goldRateMultiplier;

    // Boss death: bonus gold + EXP + celebration
    if (this.currentBoss === enemy) {
      this.currentBoss = null;
      this.runGold += 50 * this.goldRateMultiplier;
      this.particles.emit(enemy.x, enemy.y, 30, '#ffdd44', {
        speedMin: 80, speedMax: 200, sizeMin: 4, sizeMax: 8, lifetime: 1.0, gravity: -20,
      });
      this.particles.emitText(enemy.x, enemy.y - 40, '+50g', '#ffdd44', { fontSize: 20, lifetime: 1.2 });

      // Boss always drops large HP potion
      this.pickups.push(new Pickup(enemy.x, enemy.y, 0, 'hp', 'large'));
    }

    // 5% chance to drop HP heart from normal enemies
    if (enemy.type !== 'boss' && Math.random() < 0.05) {
      this.pickups.push(new Pickup(enemy.x, enemy.y, 0, 'hp', 'normal'));
    }

    // Drop EXP gems
    this.pickups.push(new Pickup(enemy.x, enemy.y, enemy.exp));

    // Heal on kill
    if (this.player.healOnKill > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.healOnKill);
    }

    // Exploder death explosion
    if (enemy.type === 'exploder' && enemy.typeDef.behavior) {
      const b = enemy.typeDef.behavior;
      this.particles.emit(enemy.x, enemy.y, 15, b.explosionColor, {
        speedMax: 150, lifetime: 0.4, sizeMax: 8,
      });
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
      // Mode buttons (archero / survivor) — match renderer layout
      const modeBtnW = 160;
      const modeBtnH = 50;
      const modeGap = 20;
      const modeTotalW = modeBtnW * 2 + modeGap;
      const modeStartX = this.canvas.width / 2 - modeTotalW / 2;
      const modeBtnY = Math.round(this.canvas.height * 0.38) + 200;

      // Archero (left) button → chapter select
      if (screenX >= modeStartX && screenX <= modeStartX + modeBtnW &&
          screenY >= modeBtnY && screenY <= modeBtnY + modeBtnH) {
        this.meta = loadMeta();
        this.state = 'chapter_select';
        return;
      }
      // Survivor (right) button
      const survivorX = modeStartX + modeBtnW + modeGap;
      if (screenX >= survivorX && screenX <= survivorX + modeBtnW &&
          screenY >= modeBtnY && screenY <= modeBtnY + modeBtnH) {
        this.startGame('survivor');
        return;
      }
      return;
    }
    if (this.state === 'chapter_select') {
      // Back button (top-left)
      if (screenX < 80 && screenY < 50) {
        this.state = 'menu';
        return;
      }
      // Chapter cards — match renderer layout
      const cardW = Math.min(320, this.canvas.width - 40);
      const cardH = 90;
      const cardGap = 16;
      const cardX = (this.canvas.width - cardW) / 2;
      const startY = this.canvas.height * 0.28;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (!isChapterUnlocked(this.meta, i)) continue;
        const cy = startY + i * (cardH + cardGap);
        if (screenX >= cardX && screenX <= cardX + cardW &&
            screenY >= cy && screenY <= cy + cardH) {
          this._startChapterIndex = i;
          this.startGame('archero');
          return;
        }
      }
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
    if (this.state === 'chapterclear') {
      // Return to chapter select so player can pick any unlocked chapter
      this.meta = loadMeta();
      this.state = 'chapter_select';
      return;
    }
    if (this.state === 'levelup' || this.state === 'roomclear') {
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
      return;
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
