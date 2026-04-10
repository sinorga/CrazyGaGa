import { getConfig } from './gameConfig.js';

export class Projectile {
  constructor(x, y, dirX, dirY, speed, opts) {
    this.x = x;
    this.y = y;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.speed = speed;
    this.damage = opts.damage;
    this.radius = opts.radius;
    this.pierce = opts.pierce || 1;
    this.color = opts.color;
    this.isEnemy = opts.isEnemy || false;
    this.alive = true;
    this._hitSet = new Set();

    // Wall bounce
    this.bounces = opts.bounces ?? 0;
    this.ricochet = opts.ricochet || false; // redirect to nearest enemy instead of reflect

    // Boomerang properties
    if (opts.isBoomerang) {
      this.isBoomerang = true;
      this.owner = opts.owner;
      this.maxRange = opts.maxRange;
      this.startX = opts.startX;
      this.startY = opts.startY;
      this.returning = opts.returning || false;
    }
  }

  update(dt, enemies) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wall bounce for player projectiles (not enemy or boomerang)
    if (!this.isEnemy && !this.isBoomerang) {
      this._handleWallBounce(enemies);
    }

    // Boomerang: check if should return
    if (this.isBoomerang && !this.returning) {
      const dx = this.x - this.startX;
      const dy = this.y - this.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= this.maxRange) {
        this.returning = true;
        this._hitSet.clear(); // can hit enemies again on return
      }
    }

    // Boomerang: home toward owner on return
    if (this.isBoomerang && this.returning && this.owner) {
      const dx = this.owner.x - this.x;
      const dy = this.owner.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        this.alive = false; // collected by player
      } else if (dist > 0) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    }
  }

  _handleWallBounce(enemies) {
    const cfg = getConfig();
    const wall = cfg.room?.wallThickness ?? 20;

    // We need canvas size — stored as roomBounds on the projectile, set by game.js
    const minX = wall + this.radius;
    const minY = wall + this.radius;
    const maxX = (this._canvasW ?? 800) - wall - this.radius;
    const maxY = (this._canvasH ?? 600) - wall - this.radius;

    let bounced = false;

    if (this.x < minX) {
      this.x = minX;
      if (this.ricochet && enemies) {
        this._ricochetToNearest(enemies);
      } else {
        this.vx = Math.abs(this.vx);
      }
      bounced = true;
    } else if (this.x > maxX) {
      this.x = maxX;
      if (this.ricochet && enemies) {
        this._ricochetToNearest(enemies);
      } else {
        this.vx = -Math.abs(this.vx);
      }
      bounced = true;
    }

    if (this.y < minY) {
      this.y = minY;
      if (this.ricochet && enemies) {
        this._ricochetToNearest(enemies);
      } else {
        this.vy = Math.abs(this.vy);
      }
      bounced = true;
    } else if (this.y > maxY) {
      this.y = maxY;
      if (this.ricochet && enemies) {
        this._ricochetToNearest(enemies);
      } else {
        this.vy = -Math.abs(this.vy);
      }
      bounced = true;
    }

    if (bounced) {
      this.bounces--;
      if (this.bounces < 0) {
        this.alive = false;
      }
    }
  }

  _ricochetToNearest(enemies) {
    let nearest = null;
    let nearDist = Infinity;
    for (const e of enemies) {
      if (!e.alive || this._hitSet.has(e._idx)) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearDist) {
        nearDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      const dx = nearest.x - this.x;
      const dy = nearest.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0) {
        this.vx = (dx / d) * this.speed;
        this.vy = (dy / d) * this.speed;
      }
    }
  }

  onHit() {
    this.pierce--;
    if (this.pierce <= 0) {
      this.alive = false;
    }
  }

  hasHit(entityId) {
    return this._hitSet.has(entityId);
  }

  markHit(entityId) {
    this._hitSet.add(entityId);
  }

  checkBounds(screenW, screenH, camera) {
    // Store canvas size for wall bounce calculations
    this._canvasW = screenW;
    this._canvasH = screenH;

    // Only kill projectile if it has no bounces left and is out of bounds
    if (this.bounces >= 0) return; // still bouncing — wall bounce handler manages lifetime
    const margin = 100;
    if (this.x < camera.x - margin || this.x > camera.x + screenW + margin ||
        this.y < camera.y - margin || this.y > camera.y + screenH + margin) {
      this.alive = false;
    }
  }
}
