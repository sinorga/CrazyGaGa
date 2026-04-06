import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '../src/roomManager.js';

// Minimal mock for game
function createMockGame() {
  return {
    canvas: { width: 800, height: 600 },
    enemies: [],
    player: { x: 400, y: 480, hp: 100, maxHp: 100 },
    _getEnemyType: (id) => ({
      id, type: 'charger', radius: 12, hp: 15, speed: 60, damage: 8,
      color: '#44cc44', exp: 1, icon: '🟢',
    }),
    triggerRoomClear: vi.fn(),
    triggerChapterClear: vi.fn(),
    particles: { emit: vi.fn() },
    pickups: [],
    chests: [],
    barrels: [],
    _spawnRoomObjects: vi.fn(),
  };
}

describe('RoomManager', () => {
  let rm;
  let game;

  beforeEach(() => {
    rm = new RoomManager();
    game = createMockGame();
  });

  it('initializes with correct defaults', () => {
    expect(rm.chapterIndex).toBe(0);
    expect(rm.roomIndex).toBe(0);
    expect(rm.state).toBe('entering');
    expect(rm.doorOpen).toBe(false);
  });

  it('enters fighting state when enemies spawn on enterRoom', () => {
    const enemies = rm.enterRoom(game);
    expect(rm.state).toBe('fighting');
    expect(enemies.length).toBeGreaterThan(0);
  });

  it('treasure room enters cleared state immediately', () => {
    // Navigate to treasure room in chapter 1 (index 11)
    rm.roomIndex = 11;
    const enemies = rm.enterRoom(game);
    expect(rm.state).toBe('cleared');
    expect(rm.doorOpen).toBe(true);
    expect(enemies.length).toBe(0);
  });

  it('door stays closed while fighting', () => {
    rm.enterRoom(game);
    expect(rm.doorOpen).toBe(false);
  });

  it('door opens when all enemies die (onEnemyDeath)', () => {
    rm.enterRoom(game);
    // Force all waves spawned
    rm._allWavesSpawned = true;
    rm.onEnemyDeath([]); // no living enemies
    expect(rm.state).toBe('cleared');
    expect(rm.doorOpen).toBe(true);
  });

  it('door stays closed if enemies still alive', () => {
    rm.enterRoom(game);
    rm._allWavesSpawned = true;
    rm.onEnemyDeath([{ alive: true }]);
    expect(rm.doorOpen).toBe(false);
  });

  it('advanceRoom increments roomIndex', () => {
    rm.enterRoom(game);
    const prev = rm.roomIndex;
    rm.advanceRoom(game);
    expect(rm.roomIndex).toBe(prev + 1);
  });

  it('advanceChapter increments chapterIndex and resets roomIndex', () => {
    rm.chapterIndex = 0;
    rm.roomIndex = 5;
    rm.advanceChapter(game);
    expect(rm.chapterIndex).toBe(1);
    expect(rm.roomIndex).toBe(0);
  });

  it('reset restores all fields to initial state', () => {
    rm.chapterIndex = 2;
    rm.roomIndex = 5;
    rm.doorOpen = true;
    rm.doorAnim = 0.8;
    rm.reset();
    expect(rm.chapterIndex).toBe(0);
    expect(rm.roomIndex).toBe(0);
    expect(rm.doorOpen).toBe(false);
    expect(rm.doorAnim).toBe(0);
    expect(rm.state).toBe('entering');
  });

  it('getDoorRect returns correct hitbox', () => {
    const door = rm.getDoorRect(800);
    expect(door.w).toBe(80); // doorWidth from config
    expect(door.x).toBeCloseTo((800 - 80) / 2, 1);
  });
});
