import { getConfig } from './gameConfig.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = getConfig().player.radius;
    this.icon = '🗡️'; // overridden by selected character

    // HP
    this.maxHp = getConfig().player.maxHp;
    this.hp = this.maxHp;
    this.alive = true;

    // Movement
    this.speed = getConfig().player.speed;

    // Combat stats
    this.armor = 0;
    this.regen = 0;
    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.expBonusMultiplier = 1;

    // Archero passive stats
    this.thorns = 0;       // fraction of contact damage reflected back
    this.vampire = 0;      // fraction of damage dealt as lifesteal
    this.freezeChance = 0; // 0..1 probability to freeze on hit
    this.poisonDps = 0;    // DPS applied to hit enemies
    this.healOnKill = 0;   // HP recovered per kill

    // Pickup
    this.pickupRange = getConfig().player.pickupRange;
    this.magnetRange = getConfig().player.magnetRange;

    // Invincibility
    this.invincible = false;
    this.invincibleTimer = 0;

    // Progression
    this.level = 1;
    this.exp = 0;
    this.kills = 0;
    this.skillLevels = {}; // { skillId: level }

    // Passive stat tracking (for evolution checks)
    this.passiveStats = {};

    // Visual effects
    this.hitFlashTimer = 0;

    // Facing direction (for rendering / aiming)
    this.facingX = 0;
    this.facingY = -1;
  }

  move(direction, dt, canvasW, canvasH) {
    if (direction.x !== 0 || direction.y !== 0) {
      this.facingX = direction.x;
      this.facingY = direction.y;
    }

    this.x += direction.x * this.speed * dt;
    this.y += direction.y * this.speed * dt;

    // Clamp to room walls (or canvas if no room config)
    const wall = getConfig().room?.wallThickness ?? 20;
    const minX = wall + this.radius;
    const minY = wall + this.radius;
    const maxX = (canvasW ?? 800) - wall - this.radius;
    const maxY = (canvasH ?? 600) - wall - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;

    const actual = Math.max(1, amount - this.armor);
    this.hp = Math.max(0, this.hp - actual);
    this.hitFlashTimer = 0.1;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    } else {
      this.invincible = true;
      this.invincibleTimer = getConfig().player.invincibleDuration;
    }
  }

  update(dt) {
    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }

    // Hit flash decay
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // HP regeneration
    if (this.regen > 0 && this.alive) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    }
  }

  applyPassive(stat, value, valueType) {
    this.passiveStats[stat] = (this.passiveStats[stat] || 0) + 1;

    if (valueType === 'flat') {
      switch (stat) {
        case 'maxHp':
          this.maxHp += value;
          this.hp += value; // heal by the same amount
          break;
        case 'armor':
          this.armor += value;
          break;
        case 'regen':
          this.regen += value;
          break;
        case 'thorns':
          this.thorns += value;
          break;
        case 'vampire':
          this.vampire += value;
          break;
        case 'freezeChance':
          this.freezeChance = Math.min(1, this.freezeChance + value);
          break;
        case 'poisonDps':
          this.poisonDps += value;
          break;
        case 'healOnKill':
          this.healOnKill += value;
          break;
      }
    } else if (valueType === 'percent') {
      switch (stat) {
        case 'speed':
          this.speed = getConfig().player.speed * (1 + this._getAccumulatedPercent('speed', value));
          this._storePercent('speed', value);
          break;
        case 'damage':
          this.damageMultiplier += value;
          break;
        case 'cooldown':
          this.cooldownMultiplier += value;
          break;
        case 'pickupRange':
          this.pickupRange = getConfig().player.pickupRange * (1 + this._getAccumulatedPercent('pickupRange', value));
          this.magnetRange = getConfig().player.magnetRange * (1 + this._getAccumulatedPercent('pickupRange', value));
          this._storePercent('pickupRange', value);
          break;
        case 'expBonus':
          this.expBonusMultiplier += value;
          break;
      }
    }
  }

  // Track accumulated percent bonuses
  _percentBonuses = {};
  _getAccumulatedPercent(stat, newValue) {
    const existing = this._percentBonuses[stat] || 0;
    return existing + newValue;
  }
  _storePercent(stat, value) {
    this._percentBonuses[stat] = (this._percentBonuses[stat] || 0) + value;
  }

  addExp(amount) {
    this.exp += Math.floor(amount * this.expBonusMultiplier);
  }

  expToNextLevel() {
    return Math.floor(
      getConfig().leveling.baseExpToLevel * Math.pow(getConfig().leveling.expGrowthFactor, this.level - 1)
    );
  }

  shouldLevelUp() {
    return this.exp >= this.expToNextLevel();
  }

  levelUp() {
    const threshold = this.expToNextLevel();
    this.exp -= threshold;
    this.level++;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.maxHp = getConfig().player.maxHp;
    this.hp = this.maxHp;
    this.alive = true;
    this.speed = getConfig().player.speed;
    this.armor = 0;
    this.regen = 0;
    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.expBonusMultiplier = 1;
    this.pickupRange = getConfig().player.pickupRange;
    this.magnetRange = getConfig().player.magnetRange;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.hitFlashTimer = 0;
    this.level = 1;
    this.exp = 0;
    this.kills = 0;
    this.skillLevels = {};
    this.passiveStats = {};
    this._percentBonuses = {};
    this.thorns = 0;
    this.vampire = 0;
    this.freezeChance = 0;
    this.poisonDps = 0;
    this.healOnKill = 0;
  }
}
