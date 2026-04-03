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

  // Mutation killers: ensure sign of subtraction matters
  it('correctly uses subtraction for dx and dy', () => {
    // a.x - b.x vs a.x + b.x: if we add, distance becomes huge → false
    const a = { x: 10, y: 0, radius: 5 };
    const b = { x: 12, y: 0, radius: 5 };
    expect(circlesOverlap(a, b)).toBe(true); // dist=2, radii=10 → overlap

    // Asymmetric case on Y axis
    const c = { x: 0, y: 10, radius: 5 };
    const d = { x: 0, y: 12, radius: 5 };
    expect(circlesOverlap(c, d)).toBe(true);
  });

  it('handles diagonal overlap with asymmetric positions', () => {
    const a = { x: 100, y: 200, radius: 15 };
    const b = { x: 110, y: 205, radius: 15 };
    // dist = sqrt(100+25) = ~11.18, sum radii = 30 → overlap
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('correctly combines dx*dx and dy*dy (not subtract)', () => {
    // If dy*dy is subtracted instead of added, result changes
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 7, y: 7, radius: 10 };
    // dist = sqrt(49+49) = ~9.9, sum radii = 20 → overlap
    expect(circlesOverlap(a, b)).toBe(true);

    // But further away, should not overlap
    const c = { x: 0, y: 0, radius: 5 };
    const d = { x: 8, y: 8, radius: 5 };
    // dist = ~11.3, sum radii = 10 → not overlapping
    expect(circlesOverlap(c, d)).toBe(false);
  });

  it('uses multiplication not division for distance squared', () => {
    // If dx*dx becomes dx/dx (=1), many overlaps change
    const a = { x: 0, y: 0, radius: 2 };
    const b = { x: 100, y: 0, radius: 2 };
    expect(circlesOverlap(a, b)).toBe(false); // dx*dx=10000 vs dx/dx=1
  });
});

describe('distance', () => {
  it('calculates distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('returns 0 for same point', () => {
    expect(distance({ x: 7, y: 7 }, { x: 7, y: 7 })).toBe(0);
  });

  // Mutation killers: sign and operation matter
  it('subtraction direction matters (not addition)', () => {
    const d = distance({ x: 10, y: 20 }, { x: 13, y: 24 });
    expect(d).toBe(5); // sqrt(9+16) = 5
    // If + instead of -, would be sqrt(23*23 + 44*44) ≠ 5
  });

  it('both axes contribute to distance', () => {
    // Pure X distance
    expect(distance({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
    // Pure Y distance
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(5);
    // Combined is longer than either axis alone
    const d = distance({ x: 0, y: 0 }, { x: 5, y: 5 });
    expect(d).toBeGreaterThan(5);
    expect(d).toBeCloseTo(Math.SQRT2 * 5, 10);
  });
});

describe('distanceSq', () => {
  it('calculates squared distance', () => {
    expect(distanceSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });

  it('sign of subtraction matters', () => {
    const dsq = distanceSq({ x: 10, y: 20 }, { x: 13, y: 24 });
    expect(dsq).toBe(25); // 9 + 16
  });

  it('both components are added not subtracted', () => {
    // If dy*dy subtracted: 9 - 16 = -7 ≠ 25
    const dsq = distanceSq({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(dsq).toBe(25);
    expect(dsq).toBeGreaterThan(0);
  });

  it('uses multiplication not division', () => {
    // dx=100 → dx*dx=10000, dx/dx=1
    const dsq = distanceSq({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(dsq).toBe(10000);
  });
});

describe('SpatialHash', () => {
  let grid;

  beforeEach(() => {
    grid = new SpatialHash();
  });

  it('inserts and queries entities', () => {
    const entity = { x: 100, y: 100, radius: 10 };
    grid.insert(entity);

    const results = grid.query(100, 100, 20);
    expect(results.has(entity)).toBe(true);
  });

  it('does not return distant entities', () => {
    const entity = { x: 1000, y: 1000, radius: 10 };
    grid.insert(entity);

    const results = grid.query(0, 0, 20);
    expect(results.has(entity)).toBe(false);
  });

  it('handles multiple entities in same cell', () => {
    const a = { x: 50, y: 50, radius: 5 };
    const b = { x: 55, y: 55, radius: 5 };
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
    const entity = { x: 64, y: 64, radius: 40 };
    grid.insert(entity);

    expect(grid.query(30, 30, 10).has(entity)).toBe(true);
    expect(grid.query(100, 100, 10).has(entity)).toBe(true);
  });

  // Mutation killers for _cellCoords division
  it('cell coordinates use division not multiplication', () => {
    // Place entity at (200, 200), cellSize=64
    // Correct cell: floor(200/64)=3. If *64: floor(200*64)=12800
    const entity = { x: 200, y: 200, radius: 5 };
    grid.insert(entity);

    // Query at the exact position should find it
    expect(grid.query(200, 200, 10).has(entity)).toBe(true);
    // Query far away should not
    expect(grid.query(0, 0, 10).has(entity)).toBe(false);
  });

  it('query range correctly expands in both directions', () => {
    // Entity at edge of query range
    const entity = { x: 150, y: 150, radius: 5 };
    grid.insert(entity);

    // Query centered at (130, 130) with radius 30 → range covers 100-160 on each axis
    const found = grid.query(130, 130, 30);
    expect(found.has(entity)).toBe(true);

    // Query centered at (50, 50) with radius 5 → range 45-55, entity at 150 → miss
    const notFound = grid.query(50, 50, 5);
    expect(notFound.has(entity)).toBe(false);
  });

  it('insert uses subtraction for min bounds and addition for max bounds', () => {
    // Entity with large radius at known position
    const entity = { x: 128, y: 128, radius: 30 };
    grid.insert(entity);

    // Should be findable from min bound side (128-30=98)
    expect(grid.query(100, 100, 5).has(entity)).toBe(true);
    // Should be findable from max bound side (128+30=158)
    expect(grid.query(155, 155, 5).has(entity)).toBe(true);
    // Should NOT be findable from far away
    expect(grid.query(0, 0, 5).has(entity)).toBe(false);
    expect(grid.query(300, 300, 5).has(entity)).toBe(false);
  });
});
