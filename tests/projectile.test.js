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

  it('marks as dead when out of bounds (no bounces)', () => {
    // bounces = -1 (depleted), so checkBounds kills it when out of range
    proj.bounces = -1;
    proj.checkBounds(800, 600, { x: 0, y: 0 });
    expect(proj.alive).toBe(true); // still in view

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

  describe('wall bounce', () => {
    it('projectile with bounces=1 reflects off left wall and decrements bounces to 0', () => {
      const p = new Projectile(30, 300, -1, 0, 200, {
        damage: 5, radius: 5, pierce: 1, color: '#fff', bounces: 1,
      });
      p._canvasW = 800;
      p._canvasH = 600;
      // Move into left wall
      p.x = 10; // inside wall (wall=20, min=25)
      p._handleWallBounce([]);
      expect(p.vx).toBeGreaterThan(0); // reflected
      expect(p.bounces).toBe(0);
      expect(p.alive).toBe(true);
    });

    it('projectile with bounces=0 dies on wall contact', () => {
      const p = new Projectile(30, 300, -1, 0, 200, {
        damage: 5, radius: 5, pierce: 1, color: '#fff', bounces: 0,
      });
      p._canvasW = 800;
      p._canvasH = 600;
      p.x = 10;
      p._handleWallBounce([]);
      expect(p.bounces).toBe(-1);
      expect(p.alive).toBe(false);
    });

    it('reflects vx to positive when hitting left wall', () => {
      const p = new Projectile(100, 300, -1, 0, 200, {
        damage: 5, radius: 5, pierce: 1, color: '#fff', bounces: 2,
      });
      p._canvasW = 800;
      p._canvasH = 600;
      p.x = 10;
      const origVy = p.vy;
      p._handleWallBounce([]);
      expect(p.vx).toBeGreaterThan(0);
      expect(p.vy).toBe(origVy); // vy unchanged on left/right wall hit
      expect(p.bounces).toBe(1);
    });
  });
});
