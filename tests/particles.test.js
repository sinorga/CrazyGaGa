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

  it('emits particles at exact position', () => {
    ps.emit(100, 200, 5, '#ff0000');
    expect(ps.particles.length).toBe(5);
    ps.particles.forEach(p => {
      expect(p.x).toBe(100);
      expect(p.y).toBe(200);
      expect(p.color).toBe('#ff0000');
      expect(p.life).toBeGreaterThan(0);
      expect(p.maxLife).toBeGreaterThan(0);
      expect(p.life).toBe(p.maxLife);
    });
  });

  it('emits correct number of particles', () => {
    ps.emit(0, 0, 1, '#fff');
    expect(ps.particles.length).toBe(1);
    ps.emit(0, 0, 10, '#fff');
    expect(ps.particles.length).toBe(11);
  });

  it('respects max particle count', () => {
    // CONFIG.particles.maxCount is 300
    ps.emit(0, 0, 500, '#fff');
    expect(ps.particles.length).toBeLessThanOrEqual(300);
  });

  it('removes expired particles on update', () => {
    ps.emit(0, 0, 3, '#fff', { lifetime: 0.1 });
    expect(ps.particles.length).toBe(3);

    ps.update(0.2);
    expect(ps.particles.length).toBe(0);
  });

  it('keeps alive particles that have not expired', () => {
    ps.emit(0, 0, 3, '#fff', { lifetime: 1.0 });
    ps.update(0.5);
    expect(ps.particles.length).toBe(3);
  });

  it('moves particles using velocity * dt (addition, not subtraction)', () => {
    ps.emit(0, 0, 1, '#fff', { speedMin: 100, speedMax: 100, lifetime: 5 });
    const p = ps.particles[0];
    const vx = p.vx;
    const vy = p.vy;

    ps.update(0.5);
    // x should be vx*0.5, not -vx*0.5
    expect(p.x).toBeCloseTo(vx * 0.5, 5);
    expect(p.y).toBeCloseTo(vy * 0.5, 5);
  });

  it('velocity is applied correctly on each axis independently', () => {
    // Create a particle with known velocity by controlling random
    ps.particles.push({
      x: 0, y: 0,
      vx: 100, vy: 0,
      size: 3, color: '#fff',
      life: 2, maxLife: 2, gravity: 0,
    });

    ps.update(1.0);
    expect(ps.particles[0].x).toBeCloseTo(100, 5);
    expect(ps.particles[0].y).toBeCloseTo(0, 5);
  });

  it('applies gravity to vy (addition, increases over time)', () => {
    ps.particles.push({
      x: 0, y: 0,
      vx: 0, vy: 0,
      size: 3, color: '#fff',
      life: 5, maxLife: 5, gravity: 200,
    });

    ps.update(1.0);
    // vy should be 0 + 200*1 = 200
    expect(ps.particles[0].vy).toBeCloseTo(200, 5);
    // y should be 0 + 0*1 = 0 (vy was 0 at start, gravity applied after move)
    // Actually: y += vy * dt first (y=0), then vy += gravity * dt (vy=200)
    // Wait, let me re-check the code order...
    // Code: p.x += p.vx * dt; p.vy += p.gravity * dt; p.life -= dt
    // So y = 0 + 0*1 = 0, then vy = 0 + 200*1 = 200
    expect(ps.particles[0].y).toBeCloseTo(0, 5);

    // Second update: y = 0 + 200*1 = 200, vy = 200 + 200 = 400
    ps.update(1.0);
    expect(ps.particles[0].y).toBeCloseTo(200, 5);
    expect(ps.particles[0].vy).toBeCloseTo(400, 5);
  });

  it('decreases life by exactly dt', () => {
    ps.emit(0, 0, 1, '#fff', { lifetime: 1.0 });
    const p = ps.particles[0];

    ps.update(0.3);
    expect(p.life).toBeCloseTo(0.7, 10);

    ps.update(0.3);
    expect(p.life).toBeCloseTo(0.4, 10);
  });

  it('life decreases (subtraction not addition)', () => {
    ps.emit(0, 0, 1, '#fff', { lifetime: 1.0 });
    const p = ps.particles[0];
    ps.update(0.1);
    expect(p.life).toBeLessThan(1.0);
  });

  it('particle size respects min/max range', () => {
    ps.emit(0, 0, 20, '#fff', { sizeMin: 3, sizeMax: 3 });
    ps.particles.forEach(p => {
      expect(p.size).toBe(3);
    });
  });

  it('particles removed from end do not affect earlier particles', () => {
    ps.emit(0, 0, 1, '#fff', { lifetime: 0.1 });
    ps.emit(50, 50, 1, '#fff', { lifetime: 10.0 });

    ps.update(0.5); // first particle dies, second survives
    expect(ps.particles.length).toBe(1);
    expect(ps.particles[0].x).not.toBe(0); // the surviving one moved from (50,50)
  });

  it('render does not crash with active particles', () => {
    ps.emit(100, 100, 5, '#ff0000', { lifetime: 1.0 });
    const ctx = {
      globalAlpha: 1,
      fillStyle: '',
      fillRect: () => {},
    };
    const camera = { x: 0, y: 0 };
    // Should not throw
    expect(() => ps.render(ctx, camera)).not.toThrow();
    expect(ctx.globalAlpha).toBe(1); // restored after render
  });
});
