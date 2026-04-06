import { CHAPTERS } from './data/chapters.js';
import { getRoomTemplate } from './data/rooms.js';
import { Enemy } from './enemy.js';
import { getConfig } from './gameConfig.js';

export class RoomManager {
  constructor() {
    this.chapterIndex = 0;
    this.roomIndex = 0;
    this.state = 'entering'; // 'entering' | 'fighting' | 'cleared' | 'transitioning'
    this.pendingWaves = [];
    this.waveTimer = 0;
    this.doorOpen = false;
    this.doorAnim = 0; // 0..1 animation progress
    this.playerInDoor = false;
    this._allWavesSpawned = false;
  }

  get currentChapter() { return CHAPTERS[this.chapterIndex]; }
  get currentRoomId()   { return this.currentChapter.rooms[this.roomIndex]; }
  get currentTemplate() { return getRoomTemplate(this.currentRoomId); }
  get isLastRoom()      { return this.roomIndex >= this.currentChapter.rooms.length - 1; }
  get isLastChapter()   { return this.chapterIndex >= CHAPTERS.length - 1; }
  get isBossRoom()      { return this.currentTemplate?.type === 'boss'; }
  get isTreasureRoom()  { return this.currentTemplate?.type === 'treasure'; }

  // Call once when entering a new room. Returns initial enemy array.
  enterRoom(game) {
    const template = this.currentTemplate;
    if (!template) return [];

    this.state = 'entering';
    this.doorOpen = false;
    this.doorAnim = 0;
    this._allWavesSpawned = false;
    this.waveTimer = 0;

    // Clone pending waves from template (sorted by delay)
    this.pendingWaves = template.waves
      .map(w => ({ ...w, enemies: [...w.enemies] }))
      .sort((a, b) => a.delay - b.delay);

    // Treasure rooms: no enemies, door pre-opened
    if (template.type === 'treasure') {
      this.state = 'cleared';
      this.doorOpen = true;
      this.doorAnim = 1;
      this._allWavesSpawned = true;
      return [];
    }

    // Spawn wave 0 immediately
    const initial = this._spawnNextWave(game);
    this.state = 'fighting';
    return initial;
  }

  // Returns array of new Enemy instances spawned this frame
  update(dt, enemies, player, game) {
    if (this.state !== 'fighting') {
      // Animate door open
      if (this.doorOpen && this.doorAnim < 1) {
        this.doorAnim = Math.min(1, this.doorAnim + dt * 2); // 0.5s open
      }
      return [];
    }

    // Animate door open even in fighting (in case it opened)
    if (this.doorOpen && this.doorAnim < 1) {
      this.doorAnim = Math.min(1, this.doorAnim + dt * 2);
    }

    this.waveTimer += dt;

    // Spawn pending waves
    const newEnemies = [];
    while (this.pendingWaves.length > 0 && this.waveTimer >= this.pendingWaves[0].delay) {
      newEnemies.push(...this._spawnNextWave(game));
    }

    if (this.pendingWaves.length === 0) {
      this._allWavesSpawned = true;
    }

    return newEnemies;
  }

  _spawnNextWave(game) {
    const wave = this.pendingWaves.shift();
    if (!wave) return [];

    const template = this.currentTemplate;
    const scale = this.currentChapter.difficultyScale;
    const spawned = [];

    for (const { typeId, count } of wave.enemies) {
      for (let i = 0; i < count; i++) {
        // Import enemy type via game's accessor
        const typeDef = game._getEnemyType(typeId);
        if (!typeDef) continue;
        // Bosses with large radii spawn at room center to avoid wall overlap
        const pos = typeDef.type === 'boss'
          ? this._centerSpawnPos(game, typeDef.radius || 30)
          : this._wallSpawnPos(game);
        const enemy = new Enemy(pos.x, pos.y, typeDef);
        // Apply chapter difficulty scaling
        enemy.hp = Math.round(enemy.hp * scale);
        enemy.maxHp = enemy.hp;
        enemy.damage = Math.round(enemy.damage * scale);
        spawned.push(enemy);
      }
    }

    return spawned;
  }

  // Safe center-area spawn for large enemies (bosses)
  _centerSpawnPos(game, radius) {
    const cfg = getConfig();
    const wall = cfg.room.wallThickness;
    const cw = game.canvas.width;
    const ch = game.canvas.height;
    const safe = wall + radius + 20;
    return {
      x: safe + Math.random() * (cw - safe * 2),
      y: safe + Math.random() * ((ch * 0.4) - safe), // upper half of room
    };
  }

  // Spawn position: random point along one of 4 walls, at least 80px from corners
  _wallSpawnPos(game) {
    const cfg = getConfig();
    const wall = cfg.room.wallThickness;
    const margin = 80;
    const cw = game.canvas.width;
    const ch = game.canvas.height;

    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: // top
        x = margin + Math.random() * (cw - margin * 2);
        y = wall + 10;
        break;
      case 1: // bottom
        x = margin + Math.random() * (cw - margin * 2);
        y = ch - wall - 10;
        break;
      case 2: // left
        x = wall + 10;
        y = margin + Math.random() * (ch - margin * 2);
        break;
      case 3: // right
        x = cw - wall - 10;
        y = margin + Math.random() * (ch - margin * 2);
        break;
    }
    return { x, y };
  }

  // Called by game._onEnemyDeath; checks if room should clear
  onEnemyDeath(enemies) {
    if (this.state !== 'fighting') return;
    if (!this._allWavesSpawned) return;

    const living = enemies.filter(e => e.alive);
    if (living.length === 0) {
      this.state = 'cleared';
      this.doorOpen = true;
    }
  }

  // Called when player overlaps exit door hitbox
  onPlayerReachDoor(game) {
    if (!this.doorOpen || this.doorAnim < 1) return;
    if (this.isBossRoom) {
      game.triggerChapterClear();
    } else {
      game.triggerRoomClear();
    }
  }

  // Advance to next room — call after ability selection
  advanceRoom(game) {
    this.roomIndex++;
    const newEnemies = this.enterRoom(game);
    game.enemies.push(...newEnemies);

    // Place player near bottom-center
    const cfg = getConfig();
    const wall = cfg.room.wallThickness;
    game.player.x = game.canvas.width / 2;
    game.player.y = game.canvas.height * cfg.room.playerStartYFraction;
  }

  // Advance to next chapter
  advanceChapter(game) {
    this.chapterIndex++;
    this.roomIndex = 0;
    const newEnemies = this.enterRoom(game);
    game.enemies.push(...newEnemies);

    game.player.x = game.canvas.width / 2;
    const cfg = getConfig();
    game.player.y = game.canvas.height * cfg.room.playerStartYFraction;
  }

  reset() {
    this.chapterIndex = 0;
    this.roomIndex = 0;
    this.state = 'entering';
    this.pendingWaves = [];
    this.waveTimer = 0;
    this.doorOpen = false;
    this.doorAnim = 0;
    this.playerInDoor = false;
    this._allWavesSpawned = false;
  }

  // Door hitbox (top-center of arena)
  getDoorRect(canvasWidth) {
    const cfg = getConfig();
    const doorW = cfg.room.doorWidth;
    const doorH = cfg.room.doorHeight;
    return {
      x: (canvasWidth - doorW) / 2,
      y: cfg.room.wallThickness - doorH / 2,
      w: doorW,
      h: doorH,
    };
  }
}
