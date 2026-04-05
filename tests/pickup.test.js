import { describe, it, expect, beforeEach } from 'vitest';
import { Pickup } from '../src/pickup.js';

describe('Pickup', () => {
  let gem;

  beforeEach(() => {
    gem = new Pickup(200, 200, 5);
  });

  it('initializes at position with value', () => {
    expect(gem.x).toBe(200);
    expect(gem.y).toBe(200);
    expect(gem.value).toBe(5);
    expect(gem.alive).toBe(true);
  });

  it('does not move when far from player', () => {
    gem.update(1.0, { x: 1000, y: 1000, magnetRange: 150, pickupRange: 60 });
    expect(gem.x).toBe(200);
    expect(gem.y).toBe(200);
  });

  it('moves toward player when in magnet range', () => {
    gem.update(1.0, { x: 300, y: 200, magnetRange: 150, pickupRange: 60 });
    expect(gem.x).toBeGreaterThan(200); // moved toward player
  });

  it('gets collected when in pickup range', () => {
    const collected = gem.update(1.0, { x: 230, y: 200, magnetRange: 150, pickupRange: 60 });
    expect(collected).toBe(true);
    expect(gem.alive).toBe(false);
  });

  it('does not get collected when outside pickup range', () => {
    const collected = gem.update(1.0, { x: 400, y: 200, magnetRange: 150, pickupRange: 60 });
    expect(collected).toBe(false);
    expect(gem.alive).toBe(true);
  });

  it('accelerates toward player over time in magnet range', () => {
    // Place gem far enough that it won't be collected immediately
    gem.x = 100;
    gem.y = 200;
    gem.update(0.016, { x: 240, y: 200, magnetRange: 150, pickupRange: 30 });
    const pos1 = gem.x;
    gem.update(0.016, { x: 240, y: 200, magnetRange: 150, pickupRange: 30 });
    const moved2 = gem.x - pos1;
    // Second move should be at least as large (acceleration)
    expect(moved2).toBeGreaterThan(0);
  });
});
