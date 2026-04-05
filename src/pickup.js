export class Pickup {
  constructor(x, y, value, type = 'gem', size = 'normal') {
    this.x = x;
    this.y = y;
    this.value = value;
    this.type = type; // 'gem' | 'hp'
    this.radius = 6;
    this.alive = true;
    this.vx = 0;
    this.vy = 0;

    if (type === 'hp') {
      this.hpValue = size === 'large' ? 40 : 20;
      this.color = '#ff6680';
    } else {
      this.hpValue = 0;
      this.color = '#44ffaa';
    }
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
