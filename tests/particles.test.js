import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSystem } from '../src/particles.js';

describe('ParticleSystem', () => {
  let ps;

  beforeEach(() => {
    ps = new ParticleSystem();
  });

  it('starts with no particles', () => {
    expect(ps.particles.length).toBe(0);
  });

  it('emits particles at position', () => {
    ps.emit(100, 200, 5, '#ff0000');
    expect(ps.particles.length).toBe(5);
    ps.particles.forEach(p => {
      expect(p.x).toBe(100);
      expect(p.y).toBe(200);
      expect(p.color).toBe('#ff0000');
    });
  });

  it('respects max particle count', () => {
    // CONFIG.particles.maxCount is 300
    ps.emit(0, 0, 500, '#fff');
    expect(ps.particles.length).toBeLessThanOrEqual(300);
  });

  it('removes expired particles on update', () => {
    ps.emit(0, 0, 3, '#fff', { lifetime: 0.1 });
    expect(ps.particles.length).toBe(3);

    // Update past lifetime
    ps.update(0.2);
    expect(ps.particles.length).toBe(0);
  });

  it('moves particles based on velocity', () => {
    ps.emit(0, 0, 1, '#fff', { speedMin: 100, speedMax: 100, lifetime: 1 });
    const p = ps.particles[0];
    const startX = p.x;
    const startY = p.y;
    const vx = p.vx;
    const vy = p.vy;

    ps.update(0.5);
    expect(p.x).toBeCloseTo(startX + vx * 0.5, 1);
    expect(p.y).toBeCloseTo(startY + vy * 0.5, 1);
  });

  it('applies gravity to particles', () => {
    ps.emit(0, 0, 1, '#fff', { speedMin: 0, speedMax: 0, lifetime: 2, gravity: 100 });
    const p = ps.particles[0];

    ps.update(1.0);
    // vy should have increased by gravity * dt
    expect(p.vy).toBeCloseTo(100, 0);
  });

  it('decreases particle life over time', () => {
    ps.emit(0, 0, 1, '#fff', { lifetime: 1.0 });
    const p = ps.particles[0];

    ps.update(0.3);
    expect(p.life).toBeCloseTo(0.7, 2);
  });
});
