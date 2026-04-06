export class Pickup {
  constructor(x, y, value, type = 'gem', size = 'normal') {
    this.x = x;
    this.y = y;
    this.value = value;
    this.type = type; // 'gem' | 'hp'
    this.radius = 6;
    this.alive = true;
    this.attracted = false; // once true, homes directly to player each frame

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

    // Once within magnet range, permanently attracted — no losing the player
    if (!this.attracted && dist < player.magnetRange) {
      this.attracted = true;
    }

    if (this.attracted && dist > 0) {
      // Direct homing: move straight toward player at fixed speed (no velocity accumulation)
      const speed = this.superMagnet ? 900 : 450;
      const move = Math.min(speed * dt, dist);
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
    }

    return false;
  }
}
