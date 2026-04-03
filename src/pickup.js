export class Pickup {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
    this.alive = true;
    this.vx = 0;
    this.vy = 0;
    this.color = '#44ffaa';
  }

  // Returns true if collected
  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Collected
    if (dist < player.pickupRange) {
      this.alive = false;
      return true;
    }

    // Magnetic pull
    if (dist < player.magnetRange && dist > 0) {
      const pullSpeed = 300; // acceleration toward player
      this.vx += (dx / dist) * pullSpeed * dt;
      this.vy += (dy / dist) * pullSpeed * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    return false;
  }
}
