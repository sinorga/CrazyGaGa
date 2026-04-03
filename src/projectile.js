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
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
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
