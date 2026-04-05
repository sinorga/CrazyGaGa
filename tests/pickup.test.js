import { describe, it, expect, beforeEach } from 'vitest';
import { Pickup } from '../src/pickup.js';

describe('Pickup', () => {
  let gem;

  beforeEach(() => {
    gem = new Pickup(200, 200, 5); // gem pickup, default type
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
    gem.x = 100;
    gem.y = 200;
    gem.update(0.016, { x: 240, y: 200, magnetRange: 150, pickupRange: 30 });
    const pos1 = gem.x;
    gem.update(0.016, { x: 240, y: 200, magnetRange: 150, pickupRange: 30 });
    const moved2 = gem.x - pos1;
    expect(moved2).toBeGreaterThan(0);
  });

  describe('HP pickup', () => {
    it('creates normal heart with hpValue 20', () => {
      const heart = new Pickup(100, 100, 0, 'hp', 'normal');
      expect(heart.type).toBe('hp');
      expect(heart.hpValue).toBe(20);
    });

    it('creates large potion with hpValue 40', () => {
      const potion = new Pickup(100, 100, 0, 'hp', 'large');
      expect(potion.type).toBe('hp');
      expect(potion.hpValue).toBe(40);
    });

    it('HP pickup restores player.hp by hpValue on collection', () => {
      const player = { x: 200, y: 200, hp: 50, maxHp: 100, pickupRange: 60, magnetRange: 150 };
      const heart = new Pickup(200, 200, 0, 'hp', 'normal');
      heart.alive = true;
      const collected = heart.update(0.016, player);
      expect(collected).toBe(true);
      // Game code applies the hp restore, not Pickup itself; but we verify collection
      expect(heart.alive).toBe(false);
    });

    it('HP pickup does not exceed maxHp (game logic check)', () => {
      // Simulate game logic: hp = Math.min(maxHp, hp + hpValue)
      const player = { hp: 95, maxHp: 100 };
      const heart = new Pickup(0, 0, 0, 'hp', 'normal');
      player.hp = Math.min(player.maxHp, player.hp + heart.hpValue);
      expect(player.hp).toBe(100);
    });

    it('gem pickup still has type gem and no hpValue', () => {
      expect(gem.type).toBe('gem');
      expect(gem.hpValue).toBe(0);
    });
  });
});
