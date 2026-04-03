import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

// Mock canvas
function createMockCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
}

describe('Game', () => {
  let game;

  beforeEach(() => {
    const canvas = createMockCanvas();
    game = new Game(canvas);
  });

  describe('state machine', () => {
    it('starts in menu state', () => {
      expect(game.state).toBe('menu');
    });

    it('transitions to playing on startGame()', () => {
      game.startGame();
      expect(game.state).toBe('playing');
    });

    it('transitions to levelup', () => {
      game.startGame();
      game.triggerLevelUp();
      expect(game.state).toBe('levelup');
    });

    it('transitions back to playing after skill selection', () => {
      game.startGame();
      game.triggerLevelUp();
      game.selectSkill(0);
      expect(game.state).toBe('playing');
    });

    it('transitions to gameover on player death', () => {
      game.startGame();
      game.triggerGameOver();
      expect(game.state).toBe('gameover');
    });

    it('resets on restart', () => {
      game.startGame();
      game.player.kills = 50;
      game.triggerGameOver();
      game.restart();
      expect(game.state).toBe('playing');
      expect(game.player.kills).toBe(0);
    });
  });

  describe('gameplay update', () => {
    it('updates player position when playing', () => {
      game.startGame();
      game.input.keys['d'] = true; // move right
      game.input.update();
      const startX = game.player.x;
      game.updatePlaying(1 / 60);
      // Player should have moved
      expect(game.player.x).not.toBe(startX);
    });

    it('does not update enemies during levelup', () => {
      game.startGame();
      // Add an enemy
      const { Enemy } = require('../src/enemy.js');
      game.enemies.push(new Enemy(100, 100, {
        id: 'slime', name: 'Test', type: 'charger',
        radius: 12, hp: 30, speed: 60, damage: 10,
        color: '#44cc44', exp: 2,
      }));
      const enemyX = game.enemies[0].x;
      game.triggerLevelUp();
      game.updatePlaying(1 / 60); // should not be called in levelup
      expect(game.enemies[0].x).toBe(enemyX); // unchanged
    });

    it('tracks elapsed time', () => {
      game.startGame();
      game.updatePlaying(1.0);
      expect(game.elapsed).toBeCloseTo(1.0, 1);
    });
  });

  describe('skill selection', () => {
    it('generates skill choices on level up', () => {
      game.startGame();
      game.triggerLevelUp();
      expect(game.skillChoices.length).toBeGreaterThan(0);
    });
  });
});
