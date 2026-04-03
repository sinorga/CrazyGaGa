// Lightweight particle system for visual effects
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, color, opts = {}) {
    const {
      speedMin = 30,
      speedMax = 100,
      sizeMin = 2,
      sizeMax = 5,
      lifetime = 0.5,
      gravity = 0,
    } = opts;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= CONFIG.particles.maxCount) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        color,
        life: lifetime,
        maxLife: lifetime,
        gravity,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const size = p.size * alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        p.x - camera.x - size / 2,
        p.y - camera.y - size / 2,
        size, size
      );
    }
    ctx.globalAlpha = 1;
  }
}
