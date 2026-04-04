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

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

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
    const margin = 100;
    if (this.x < camera.x - margin || this.x > camera.x + screenW + margin ||
        this.y < camera.y - margin || this.y > camera.y + screenH + margin) {
      this.alive = false;
    }
  }
}
