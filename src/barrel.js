export class Barrel {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.hp = 30;
    this.alive = true;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }
}
