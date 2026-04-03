import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash, circlesOverlap, distance, distanceSq } from '../src/collision.js';

describe('circlesOverlap', () => {
  it('detects overlapping circles', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 15, y: 0, radius: 10 };
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('detects non-overlapping circles', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 25, y: 0, radius: 10 };
    expect(circlesOverlap(a, b)).toBe(false);
  });

  it('detects touching circles as non-overlapping (exclusive)', () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 20, y: 0, radius: 10 };
    expect(circlesOverlap(a, b)).toBe(false);
  });

  it('handles identical positions', () => {
    const a = { x: 5, y: 5, radius: 10 };
    const b = { x: 5, y: 5, radius: 10 };
    expect(circlesOverlap(a, b)).toBe(true);
  });
});

describe('distance', () => {
  it('calculates distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('returns 0 for same point', () => {
    expect(distance({ x: 7, y: 7 }, { x: 7, y: 7 })).toBe(0);
  });
});

describe('distanceSq', () => {
  it('calculates squared distance', () => {
    expect(distanceSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });
});

describe('SpatialHash', () => {
  let grid;

  beforeEach(() => {
    grid = new SpatialHash();
  });

  it('inserts and queries entities', () => {
    const entity = { x: 100, y: 100, radius: 10, id: 'a' };
    grid.insert(entity);

    const results = grid.query(100, 100, 20);
    expect(results.has(entity)).toBe(true);
  });

  it('does not return distant entities', () => {
    const entity = { x: 1000, y: 1000, radius: 10, id: 'far' };
    grid.insert(entity);

    const results = grid.query(0, 0, 20);
    expect(results.has(entity)).toBe(false);
  });

  it('handles multiple entities in same cell', () => {
    const a = { x: 50, y: 50, radius: 5, id: 'a' };
    const b = { x: 55, y: 55, radius: 5, id: 'b' };
    grid.insert(a);
    grid.insert(b);

    const results = grid.query(52, 52, 20);
    expect(results.has(a)).toBe(true);
    expect(results.has(b)).toBe(true);
  });

  it('clears all entities', () => {
    grid.insert({ x: 50, y: 50, radius: 5 });
    grid.clear();

    const results = grid.query(50, 50, 20);
    expect(results.size).toBe(0);
  });

  it('handles entities spanning multiple cells', () => {
    // Large entity that spans cell boundaries
    const entity = { x: 64, y: 64, radius: 40 };
    grid.insert(entity);

    // Should be found from various nearby positions
    expect(grid.query(30, 30, 10).has(entity)).toBe(true);
    expect(grid.query(100, 100, 10).has(entity)).toBe(true);
  });
});
