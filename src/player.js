import { CONFIG } from './config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.player.radius;

    // HP
    this.maxHp = CONFIG.player.maxHp;
    this.hp = this.maxHp;
    this.alive = true;

    // Movement
    this.speed = CONFIG.player.speed;

    // Combat stats
    this.armor = 0;
    this.regen = 0;
    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.expBonusMultiplier = 1;

    // Pickup
    this.pickupRange = CONFIG.player.pickupRange;
    this.magnetRange = CONFIG.player.magnetRange;

    // Invincibility
    this.invincible = false;
    this.invincibleTimer = 0;

    // Progression
    this.level = 1;
    this.exp = 0;
    this.kills = 0;
    this.skillLevels = {}; // { skillId: level }

    // Facing direction (for rendering / aiming)
    this.facingX = 0;
    this.facingY = -1;
  }

  move(direction, dt) {
    if (direction.x !== 0 || direction.y !== 0) {
      this.facingX = direction.x;
      this.facingY = direction.y;
    }

    this.x += direction.x * this.speed * dt;
    this.y += direction.y * this.speed * dt;

    // Clamp to map boundaries
    this.x = Math.max(this.radius, Math.min(CONFIG.map.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CONFIG.map.height - this.radius, this.y));
  }

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;

    const actual = Math.max(1, amount - this.armor);
    this.hp = Math.max(0, this.hp - actual);

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    } else {
      this.invincible = true;
      this.invincibleTimer = CONFIG.player.invincibleDuration;
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

    // HP regeneration
    if (this.regen > 0 && this.alive) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    }
  }

  applyPassive(stat, value, valueType) {
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
      }
    } else if (valueType === 'percent') {
      switch (stat) {
        case 'speed':
          this.speed = CONFIG.player.speed * (1 + this._getAccumulatedPercent('speed', value));
          this._storePercent('speed', value);
          break;
        case 'damage':
          this.damageMultiplier += value;
          break;
        case 'cooldown':
          this.cooldownMultiplier += value;
          break;
        case 'pickupRange':
          this.pickupRange = CONFIG.player.pickupRange * (1 + this._getAccumulatedPercent('pickupRange', value));
          this.magnetRange = CONFIG.player.magnetRange * (1 + this._getAccumulatedPercent('pickupRange', value));
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
      CONFIG.leveling.baseExpToLevel * Math.pow(CONFIG.leveling.expGrowthFactor, this.level - 1)
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
    this.maxHp = CONFIG.player.maxHp;
    this.hp = this.maxHp;
    this.alive = true;
    this.speed = CONFIG.player.speed;
    this.armor = 0;
    this.regen = 0;
    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.expBonusMultiplier = 1;
    this.pickupRange = CONFIG.player.pickupRange;
    this.magnetRange = CONFIG.player.magnetRange;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.level = 1;
    this.exp = 0;
    this.kills = 0;
    this.skillLevels = {};
    this._percentBonuses = {};
  }
}
