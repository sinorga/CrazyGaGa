export class Chest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.open = false;
    this.alive = true;
  }

  tryOpen(player) {
    if (this.open) return null;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (dx * dx + dy * dy < (this.radius + player.radius) ** 2) {
      this.open = true;
      return this._roll();
    }
    return null;
  }

  _roll() {
    const r = Math.random();
    if (r < 0.4) return { type: 'hp', value: 60 };
    if (r < 0.7) return { type: 'gold', value: 30 };
    return { type: 'scroll' };
  }
}
