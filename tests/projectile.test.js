import { describe, it, expect, beforeEach } from 'vitest';
import { Projectile } from '../src/projectile.js';

describe('Projectile', () => {
  let proj;

  beforeEach(() => {
    proj = new Projectile(100, 100, 1, 0, 300, { damage: 10, radius: 5, pierce: 1, color: '#fff' });
  });

  it('initializes correctly', () => {
    expect(proj.x).toBe(100);
    expect(proj.y).toBe(100);
    expect(proj.damage).toBe(10);
    expect(proj.radius).toBe(5);
    expect(proj.pierce).toBe(1);
    expect(proj.alive).toBe(true);
  });

  it('moves in direction at speed', () => {
    proj.update(1.0);
    expect(proj.x).toBeCloseTo(400, 0); // 100 + 300*1
    expect(proj.y).toBeCloseTo(100, 0);
  });

  it('moves diagonally', () => {
    const p = new Projectile(0, 0, 0.707, 0.707, 100, { damage: 5, radius: 3, pierce: 1, color: '#f00' });
    p.update(1.0);
    expect(p.x).toBeCloseTo(70.7, 0);
    expect(p.y).toBeCloseTo(70.7, 0);
  });

  it('dies when pierce reaches 0 after hit', () => {
    proj.onHit();
    expect(proj.pierce).toBe(0);
    expect(proj.alive).toBe(false);
  });

  it('survives hit with pierce > 1', () => {
    const p = new Projectile(0, 0, 1, 0, 100, { damage: 5, radius: 3, pierce: 3, color: '#f00' });
    p.onHit();
    expect(p.pierce).toBe(2);
    expect(p.alive).toBe(true);
  });

  it('marks as dead when out of bounds', () => {
    proj.checkBounds(800, 600, { x: 0, y: 0 });
    expect(proj.alive).toBe(true); // still in view

    // Move far away
    proj.x = 5000;
    proj.checkBounds(800, 600, { x: 0, y: 0 });
    expect(proj.alive).toBe(false);
  });

  it('tracks hit enemies to avoid double-hit', () => {
    const enemyId = 42;
    expect(proj.hasHit(enemyId)).toBe(false);
    proj.markHit(enemyId);
    expect(proj.hasHit(enemyId)).toBe(true);
  });
});
