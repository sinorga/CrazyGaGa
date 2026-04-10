import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONFIG } from '../src/config.js';

// Minimal canvas stub for Game constructor
function makeCanvas(w = 800, h = 600) {
  return {
    width: w,
    height: h,
    getContext: () => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      measureText: () => ({ width: 0 }),
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokeText: vi.fn(),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  };
}

// localStorage stub
const store = {};
vi.stubGlobal('localStorage', {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
});

describe('dual-mode startGame', () => {
  let Game;
  let canvas;

  beforeEach(async () => {
    canvas = makeCanvas();
    ({ Game } = await import('../src/game.js'));
  });

  it('defaults to archero mode', () => {
    const game = new Game(canvas);
    expect(game.mode).toBe('archero');
  });

  it('startGame("archero") sets mode to archero', () => {
    const game = new Game(canvas);
    game.startGame('archero');
    expect(game.mode).toBe('archero');
  });

  it('startGame("survivor") sets mode to survivor', () => {
    const game = new Game(canvas);
    game.startGame('survivor');
    expect(game.mode).toBe('survivor');
  });

  it('archero mode: player starts near canvas bottom center', () => {
    const game = new Game(canvas);
    game.startGame('archero');
    expect(game.player.x).toBeCloseTo(canvas.width / 2, 0);
    expect(game.player.y).toBeGreaterThan(canvas.height * 0.5);
  });

  it('survivor mode: player starts near map center', () => {
    const game = new Game(canvas);
    game.startGame('survivor');
    expect(game.player.x).toBeCloseTo(CONFIG.map.width / 2, 0);
    expect(game.player.y).toBeCloseTo(CONFIG.map.height / 2, 0);
  });

  it('survivor mode: camera initialized to map center', () => {
    const game = new Game(canvas);
    game.startGame('survivor');
    expect(game.camera.x).toBeCloseTo(CONFIG.map.width / 2 - canvas.width / 2, 0);
    expect(game.camera.y).toBeCloseTo(CONFIG.map.height / 2 - canvas.height / 2, 0);
  });

  it('restart() uses current mode', () => {
    const game = new Game(canvas);
    game.startGame('survivor');
    game.restart();
    expect(game.mode).toBe('survivor');
  });
});

describe('WaveSpawner', () => {
  it('resets with config values', async () => {
    const { WaveSpawner } = await import('../src/spawner.js');
    const spawner = new WaveSpawner();
    expect(spawner.spawnInterval).toBe(CONFIG.waves.spawnInterval);
    expect(spawner.timer).toBe(CONFIG.waves.initialDelay);
  });

  it('does not spawn before timer fires', async () => {
    const { WaveSpawner } = await import('../src/spawner.js');
    const spawner = new WaveSpawner();
    const spawned = [];
    spawner.update(0.1, [], { x: 1500, y: 1500 }, (id, x, y) => spawned.push({ id, x, y }));
    expect(spawned.length).toBe(0);
  });

  it('spawns enemies when timer expires', async () => {
    const { WaveSpawner } = await import('../src/spawner.js');
    const spawner = new WaveSpawner();
    const spawned = [];
    // Advance past initialDelay
    spawner.update(CONFIG.waves.initialDelay + 0.1, [], { x: 1500, y: 1500 }, (id, x, y) => spawned.push({ id, x, y }));
    expect(spawned.length).toBeGreaterThan(0);
  });
});
