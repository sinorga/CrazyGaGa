import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { applyUserSettings } from './settings.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Apply saved user settings before game instantiation
applyUserSettings();

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const game = new Game(canvas);
const renderer = new Renderer(ctx, canvas);

// Wire damage effects
game.onPlayerDamage = (isBoss) => {
  renderer.triggerDamageFlash();
  renderer.triggerShake(isBoss ? 12 : 4);
};
game.onLevelUpFlash = () => {
  renderer.triggerLevelUpFlash();
};

// Touch tracking — used to distinguish scroll/drag from tap, and to scroll config editor
let touchStartX = 0, touchStartY = 0, lastTouchY = 0, touchIntent = null;

canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  if (touch) {
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    lastTouchY = touch.clientY;
    touchIntent = null;
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  if (!touch) return;

  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  // Determine intent on first significant movement
  if (!touchIntent && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
    touchIntent = Math.abs(dx) > Math.abs(dy) ? 'drag' : 'scroll';
  }

  if (game.state === 'config_editor') {
    const rect = canvas.getBoundingClientRect();
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    if (touchIntent === 'drag') {
      game.handleSettingsDrag(tx, ty);
    } else if (touchIntent === 'scroll') {
      const delta = touch.clientY - lastTouchY;
      if (Math.abs(delta) > 0) game.handleSettingsScroll(-delta);
    }
    e.preventDefault();
  }

  lastTouchY = touch.clientY;
}, { passive: false });

// Tap handler — only fires if movement was small (not a scroll/drag)
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  if (!touch) return;

  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  // Suppress click if the finger moved more than ~12px (scroll/drag gesture)
  if (Math.sqrt(dx * dx + dy * dy) < 12) {
    const rect = canvas.getBoundingClientRect();
    game.handleClick(touch.clientX - rect.left, touch.clientY - rect.top);
  }
});

// Mouse drag for slider knobs in config editor
canvas.addEventListener('mousemove', (e) => {
  if (game.state === 'config_editor' && e.buttons === 1) {
    const rect = canvas.getBoundingClientRect();
    game.handleSettingsDrag(e.clientX - rect.left, e.clientY - rect.top);
  }
});

// Click handler for desktop
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.handleClick(e.clientX - rect.left, e.clientY - rect.top);
});

// Scroll support for config editor
canvas.addEventListener('wheel', (e) => {
  if (game.state === 'config_editor') {
    game.handleSettingsScroll(e.deltaY);
    e.preventDefault();
  }
}, { passive: false });

// Fixed timestep game loop
const FIXED_DT = 1 / 60;
let accumulator = 0;
let lastTime = 0;

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
  lastTime = timestamp;
  accumulator += dt;

  // Enable joystick only during gameplay
  game.input.enabled = (game.state === 'playing');

  // Fixed timestep updates
  while (accumulator >= FIXED_DT) {
    if (game.state === 'playing') {
      game.updatePlaying(FIXED_DT);
    }
    renderer.updateEffects(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  // Render
  render();
  requestAnimationFrame(loop);
}

function render() {
  if (game.state === 'menu') {
    renderer.drawMenu(canvas, game.meta);
    return;
  }
  if (game.state === 'shop') {
    renderer.drawShopPage(canvas, game.meta);
    return;
  }
  if (game.state === 'characters') {
    renderer.drawCharacterSelect(canvas, game.meta);
    return;
  }
  if (game.state === 'config_editor') {
    renderer.drawConfigEditor(canvas, game.configEditorState);
    return;
  }

  const cam = renderer.applyShake(game.camera);
  renderer.clear(cam);
  if (game.mode === 'archero') {
    renderer.drawRoom(game.roomManager, cam);
    renderer.drawDoor(game.roomManager, game.elapsed);
    renderer.drawChests(game.chests, cam, game.elapsed);
    renderer.drawBarrels(game.barrels, cam);
  } else {
    renderer.drawMap(cam);
  }
  renderer.drawPickups(game.pickups, cam, game.elapsed);
  renderer.drawEnemies(game.enemies, cam, game.elapsed);
  renderer.drawProjectiles(game.projectiles, cam);
  renderer.drawEnemyProjectiles(game.enemyProjectiles, cam);
  renderer.drawOrbitWeapons(game.weaponManager.weapons, cam);
  game.particles.render(ctx, cam);
  renderer.drawPlayer(game.player, cam, game.elapsed);
  renderer.drawDamageFlash();
  renderer.drawLevelUpFlash();
  renderer.drawHUD(game.player, game.elapsed, game.runGold, game.player.skillLevels);
  if (game.mode === 'archero' && game.state === 'playing') {
    renderer.drawChapterHUD(game.roomManager);
  }
  if (game.currentBoss) {
    renderer.drawBossHPBar(game.currentBoss);
  }
  if (game.bossEntrance) {
    renderer.drawBossEntrance(canvas, game.bossEntrance);
  }
  renderer.drawJoystick(game.input);

  if (game.state === 'paused') {
    renderer.drawPauseOverlay(canvas);
  }
  if (game.state === 'levelup') {
    renderer.drawLevelUpPanel(game.skillChoices, canvas);
  }
  if (game.state === 'roomclear') {
    renderer.drawRoomClearPanel(game.skillChoices, canvas);
  }
  if (game.state === 'chapterclear') {
    renderer.drawChapterClear(canvas, game.chapterClearNum, game.runGold, game.roomManager.isLastChapter);
  }
  if (game.state === 'gameover') {
    renderer.drawGameOver(game.player, game.elapsed, canvas, game.runGold);
  }
  if (game.state === 'victory') {
    renderer.drawVictory(game.player, game.elapsed, canvas, game.runGold);
  }
  renderer.drawTransition();
}

// Start loop
requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(loop);
});
