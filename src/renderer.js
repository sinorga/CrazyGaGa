import { CONFIG, VERSION } from './config.js';
import { SETTINGS_DEFS } from './settings.js';
import { getUpgradeDefs, getCharacterDefs, getSkillDefs } from './gameConfig.js';

// Mirror of constants in configEditor.js (kept in sync manually)
const SETTINGS_ROW_H = 55;
const SETTINGS_CONTENT_Y = 52; // TAB_BAR_H(42) + 10

export class Renderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Damage flash
    this.damageFlashTimer = 0;

    // Level-up flash
    this.levelUpFlashTimer = 0;

    // Screen transition
    this.transition = null; // { alpha, direction: 'in'|'out', speed, callback }

    // Menu animation time
    this.menuTime = 0;

    // Animated starfield for menu/lobby screens
    this.stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.00018 + 0.00005,
      alpha: Math.random() * 0.55 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  // Lighten a #rrggbb color by mixing toward white
  _lightenColor(hex, t) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`;
  }

  // Darken a #rrggbb color by multiplying channels
  _darkenColor(hex, t) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return `rgb(${Math.round(r*(1-t))},${Math.round(g*(1-t))},${Math.round(b*(1-t))})`;
  }

  // Sphere-shaded filled circle (highlight offset top-left)
  _drawSphere(sx, sy, r, color) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.35, r * 0.06, sx, sy, r);
    g.addColorStop(0, this._lightenColor(color, 0.55));
    g.addColorStop(0.55, color);
    g.addColorStop(1, this._darkenColor(color, 0.45));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Player sprite — unique design per character class ────────────────────
  _drawPlayerSprite(sx, sy, r, player) {
    const ctx = this.ctx;
    const color = player.color || '#00d4ff';
    const fx = player.facingX || 0;
    const fy = player.facingY || -1;
    const faceAngle = Math.atan2(fy, fx);

    ctx.save();
    ctx.translate(sx, sy);

    if (color === '#aa66ff') {
      // ── MAGE: pointed wizard hat + flowing robes ──────────────────────────
      // Robe body (wide oval)
      const robeG = ctx.createRadialGradient(-r * 0.15, r * 0.1, 0, 0, r * 0.25, r * 1.1);
      robeG.addColorStop(0, '#cc99ff');
      robeG.addColorStop(0.5, '#aa66ff');
      robeG.addColorStop(1, '#551188');
      ctx.shadowColor = '#aa66ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = robeG;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.75, r * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head circle
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffddbb';
      ctx.beginPath(); ctx.arc(0, -r * 0.18, r * 0.32, 0, Math.PI * 2); ctx.fill();

      // Wizard hat (tall triangle + brim)
      const hatG = ctx.createLinearGradient(-r * 0.4, -r * 1.1, r * 0.2, -r * 0.4);
      hatG.addColorStop(0, '#cc99ff'); hatG.addColorStop(1, '#330066');
      ctx.fillStyle = hatG;
      ctx.beginPath();
      ctx.moveTo(-r * 0.38, -r * 0.34);
      ctx.lineTo(r * 0.1, -r * 1.1);
      ctx.lineTo(r * 0.42, -r * 0.34);
      ctx.closePath(); ctx.fill();
      // Brim
      ctx.fillStyle = '#882299';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.36, r * 0.48, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      // Hat band star
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.1 : r * 0.04;
        i === 0 ? ctx.moveTo(r * 0.06 + Math.cos(a) * rad, -r * 0.62 + Math.sin(a) * rad)
                : ctx.lineTo(r * 0.06 + Math.cos(a) * rad, -r * 0.62 + Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill();

      // Staff (direction-oriented)
      ctx.save(); ctx.rotate(faceAngle + Math.PI / 2);
      ctx.strokeStyle = '#cc9944'; ctx.lineWidth = Math.max(2, r * 0.16); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.5); ctx.lineTo(r * 0.55, -r * 0.85); ctx.stroke();
      // Orb atop staff
      ctx.shadowColor = '#ff88ff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff88ff';
      ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.92, r * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

    } else if (color === '#ffdd44') {
      // ── PALADIN: heavy armor + large kite shield ───────────────────────────
      ctx.shadowColor = '#ffdd44'; ctx.shadowBlur = 18;

      // Body armor (broad torso)
      const armorG = ctx.createRadialGradient(-r * 0.2, -r * 0.1, 0, 0, 0, r * 1.05);
      armorG.addColorStop(0, '#ffe888');
      armorG.addColorStop(0.4, '#cc9922');
      armorG.addColorStop(1, '#664400');
      ctx.fillStyle = armorG;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.2, r * 0.72, r * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      // Helmet (rounded top)
      ctx.shadowBlur = 0;
      const helmG = ctx.createLinearGradient(-r * 0.4, -r * 0.9, r * 0.4, -r * 0.3);
      helmG.addColorStop(0, '#ffe888'); helmG.addColorStop(1, '#886600');
      ctx.fillStyle = helmG;
      ctx.beginPath();
      ctx.arc(0, -r * 0.3, r * 0.42, Math.PI, 0);
      ctx.lineTo(r * 0.42, r * 0.05);
      ctx.lineTo(-r * 0.42, r * 0.05);
      ctx.closePath(); ctx.fill();
      // Visor slit
      ctx.strokeStyle = '#333311'; ctx.lineWidth = Math.max(1.5, r * 0.1);
      ctx.beginPath(); ctx.moveTo(-r * 0.24, -r * 0.22); ctx.lineTo(r * 0.24, -r * 0.22); ctx.stroke();

      // Kite shield (direction-oriented)
      ctx.save(); ctx.rotate(faceAngle + Math.PI / 2);
      const shieldG = ctx.createLinearGradient(-r * 0.4, -r * 0.6, r * 0.1, r * 0.6);
      shieldG.addColorStop(0, '#aaccff'); shieldG.addColorStop(1, '#224488');
      ctx.fillStyle = shieldG;
      ctx.beginPath();
      ctx.moveTo(r * 0.62, -r * 0.58);
      ctx.lineTo(r * 0.62 + r * 0.42, -r * 0.1);
      ctx.lineTo(r * 0.62 + r * 0.28, r * 0.52);
      ctx.lineTo(r * 0.62, r * 0.72);
      ctx.lineTo(r * 0.62 - r * 0.28, r * 0.52);
      ctx.lineTo(r * 0.62 - r * 0.42, -r * 0.1);
      ctx.closePath(); ctx.fill();
      // Shield cross
      ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.2, r * 0.12);
      ctx.beginPath(); ctx.moveTo(r * 0.62, -r * 0.4); ctx.lineTo(r * 0.62, r * 0.52); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.62 - r * 0.28, r * 0.05); ctx.lineTo(r * 0.62 + r * 0.28, r * 0.05); ctx.stroke();
      // Mace handle
      ctx.strokeStyle = '#886622'; ctx.lineWidth = Math.max(2, r * 0.18);
      ctx.beginPath(); ctx.moveTo(-r * 0.48, r * 0.1); ctx.lineTo(-r * 0.48, -r * 0.72); ctx.stroke();
      // Mace head
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath(); ctx.arc(-r * 0.48, -r * 0.78, r * 0.22, 0, Math.PI * 2); ctx.fill();
      // Spikes on mace
      ctx.strokeStyle = '#dddddd'; ctx.lineWidth = Math.max(1.2, r * 0.1);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.48 + Math.cos(a) * r * 0.22, -r * 0.78 + Math.sin(a) * r * 0.22);
        ctx.lineTo(-r * 0.48 + Math.cos(a) * r * 0.38, -r * 0.78 + Math.sin(a) * r * 0.38);
        ctx.stroke();
      }
      ctx.restore();

    } else {
      // ── WARRIOR (#00d4ff): armored knight with sword ───────────────────────
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 18;

      // Body (compact torso)
      const bodyG = ctx.createRadialGradient(-r * 0.18, -r * 0.1, 0, 0, 0, r);
      bodyG.addColorStop(0, '#88eeff');
      bodyG.addColorStop(0.45, '#00a8cc');
      bodyG.addColorStop(1, '#003355');
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.22, r * 0.62, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Helmet (rounded top + cheek guards)
      ctx.shadowBlur = 0;
      const helmG = ctx.createLinearGradient(-r * 0.38, -r * 0.9, r * 0.38, -r * 0.3);
      helmG.addColorStop(0, '#88eeff'); helmG.addColorStop(1, '#004466');
      ctx.fillStyle = helmG;
      ctx.beginPath();
      ctx.arc(0, -r * 0.25, r * 0.38, Math.PI * 1.15, Math.PI * 1.85);
      ctx.lineTo(r * 0.38, r * 0.08);
      ctx.lineTo(-r * 0.38, r * 0.08);
      ctx.closePath(); ctx.fill();
      // T-visor
      ctx.strokeStyle = '#003355'; ctx.lineWidth = Math.max(1.5, r * 0.1);
      ctx.beginPath(); ctx.moveTo(-r * 0.22, -r * 0.2); ctx.lineTo(r * 0.22, -r * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r * 0.42); ctx.lineTo(0, -r * 0.06); ctx.stroke();

      // Sword (direction-facing)
      ctx.save(); ctx.rotate(faceAngle + Math.PI / 2);
      ctx.strokeStyle = '#ccddff'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, r * 0.62); ctx.lineTo(0, -r * 0.92); ctx.stroke();
      // Guard
      ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.5, r * 0.14);
      ctx.beginPath(); ctx.moveTo(-r * 0.38, -r * 0.18); ctx.lineTo(r * 0.38, -r * 0.18); ctx.stroke();
      // Pommel
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath(); ctx.arc(0, r * 0.66, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Specular on body
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.08, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // ── Enemy sprite — unique silhouette per enemy ID ───────────────────────
  _drawEnemySprite(sx, sy, r, enemy) {
    const ctx = this.ctx;
    const color = enemy.color;
    const id = enemy.typeDef?.id || '';

    ctx.save();
    ctx.translate(sx, sy);

    if (id === 'slime') {
      // Blob with lumpy outline
      ctx.shadowColor = color; ctx.shadowBlur = 12;
      const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, r * 0.05, r * 0.05, r * 1.1);
      g.addColorStop(0, this._lightenColor(color, 0.55));
      g.addColorStop(0.5, color);
      g.addColorStop(1, this._darkenColor(color, 0.45));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.5, -r * 1.15, r * 1.2, -r * 0.4, r * 1.0, r * 0.25);
      ctx.bezierCurveTo(r * 0.85, r * 0.75, r * 0.45, r * 0.95, 0, r * 0.88);
      ctx.bezierCurveTo(-r * 0.45, r * 0.95, -r * 0.85, r * 0.75, -r * 1.0, r * 0.25);
      ctx.bezierCurveTo(-r * 1.2, -r * 0.4, -r * 0.5, -r * 1.15, 0, -r);
      ctx.fill();
      // Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.12, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.12, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-r * 0.24, -r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.32, -r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'fast_bat') {
      // Bat: wing silhouette
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      const g = ctx.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r * 1.2);
      g.addColorStop(0, this._lightenColor(color, 0.4));
      g.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = g;
      // Wings
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, 0);
      ctx.bezierCurveTo(-r * 0.4, -r * 0.6, -r * 1.2, -r * 0.8, -r * 1.1, r * 0.4);
      ctx.bezierCurveTo(-r * 0.9, r * 0.7, -r * 0.4, r * 0.3, -r * 0.1, r * 0.2);
      ctx.bezierCurveTo(r * 0.1, r * 0.3, r * 0.4, r * 0.7, r * 1.1, r * 0.4);
      ctx.bezierCurveTo(r * 1.2, -r * 0.8, r * 0.4, -r * 0.6, r * 0.1, 0);
      ctx.closePath(); ctx.fill();
      // Body
      ctx.shadowBlur = 0;
      ctx.fillStyle = this._darkenColor(color, 0.2);
      ctx.beginPath(); ctx.ellipse(0, r * 0.05, r * 0.28, r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      // Ears
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.3); ctx.lineTo(-r * 0.05, -r * 0.6); ctx.lineTo(r * 0.05, -r * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.3); ctx.lineTo(r * 0.18, -r * 0.6); ctx.lineTo(r * 0.28, -r * 0.3); ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff4444';
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.06, r * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.06, r * 0.08, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'skeleton') {
      // Skull + ribcage silhouette
      ctx.shadowColor = color; ctx.shadowBlur = 8;
      // Ribcage / body
      ctx.fillStyle = this._darkenColor(color, 0.2);
      ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.52, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      // Rib lines
      ctx.strokeStyle = this._darkenColor(color, 0.5);
      ctx.lineWidth = Math.max(1, r * 0.1);
      for (let i = -1; i <= 1; i += 1) {
        const ry = r * 0.38 + i * r * 0.22;
        ctx.beginPath();
        ctx.moveTo(-r * 0.42, ry); ctx.bezierCurveTo(-r * 0.52, ry - r * 0.1, -r * 0.52, ry + r * 0.1, -r * 0.42, ry + r * 0.04);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.42, ry); ctx.bezierCurveTo(r * 0.52, ry - r * 0.1, r * 0.52, ry + r * 0.1, r * 0.42, ry + r * 0.04);
        ctx.stroke();
      }
      // Skull
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.48, 0, Math.PI * 2); ctx.fill();
      // Jaw
      ctx.fillStyle = this._darkenColor(color, 0.15);
      ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.36, 0, Math.PI); ctx.fill();
      // Eye sockets
      ctx.fillStyle = '#111133';
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.28, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.18, -r * 0.28, r * 0.14, 0, Math.PI * 2); ctx.fill();
      // Teeth
      ctx.fillStyle = color;
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * r * 0.18 - r * 0.06, r * 0.02, r * 0.1, r * 0.15);
      }

    } else if (id === 'mage') {
      // Wizard: tall hat + robe
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      // Robe
      const robeG = ctx.createRadialGradient(-r * 0.15, r * 0.15, 0, 0, r * 0.3, r);
      robeG.addColorStop(0, this._lightenColor(color, 0.4));
      robeG.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = robeG;
      ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.62, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      // Face
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffddbb';
      ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.3, 0, Math.PI * 2); ctx.fill();
      // Tall hat
      ctx.fillStyle = this._darkenColor(color, 0.35);
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -r * 0.28);
      ctx.lineTo(-r * 0.15, -r * 1.05);
      ctx.lineTo(r * 0.15, -r * 1.05);
      ctx.lineTo(r * 0.42, -r * 0.28);
      ctx.closePath(); ctx.fill();
      // Brim
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.3, r * 0.5, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffff44';
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
      // Magic orb
      ctx.fillStyle = '#ff88ff';
      ctx.shadowColor = '#ff88ff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(r * 0.58, r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'archer') {
      // Archer: hooded figure + bow
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      // Body
      const bg = ctx.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r);
      bg.addColorStop(0, this._lightenColor(color, 0.35));
      bg.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.55, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      // Hood/head
      ctx.shadowBlur = 0;
      ctx.fillStyle = this._darkenColor(color, 0.3);
      ctx.beginPath();
      ctx.arc(0, -r * 0.25, r * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.25); ctx.lineTo(0, -r * 0.72); ctx.lineTo(r * 0.4, -r * 0.25); ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffaa44';
      ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.22, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.12, -r * 0.22, r * 0.07, 0, Math.PI * 2); ctx.fill();
      // Bow
      ctx.strokeStyle = '#cc8833'; ctx.lineWidth = Math.max(1.5, r * 0.13); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 0.62, -r * 0.62); ctx.bezierCurveTo(r * 1.05, -r * 0.05, r * 1.05, r * 0.55, r * 0.62, r * 0.62);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#eedd88'; ctx.lineWidth = Math.max(0.8, r * 0.06);
      ctx.beginPath(); ctx.moveTo(r * 0.62, -r * 0.62); ctx.lineTo(r * 0.62, r * 0.62); ctx.stroke();

    } else if (id === 'golem') {
      // Chunky stone block body
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      const stoneG = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.1);
      stoneG.addColorStop(0, this._lightenColor(color, 0.4));
      stoneG.addColorStop(0.6, color);
      stoneG.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = stoneG;
      // Block body
      this._roundRect(-r * 0.82, -r * 0.72, r * 1.64, r * 1.62, r * 0.15);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Stone cracks
      ctx.strokeStyle = this._darkenColor(color, 0.55);
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.5); ctx.lineTo(r * 0.1, r * 0.2); ctx.lineTo(r * 0.45, -r * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.2); ctx.lineTo(-r * 0.2, r * 0.6); ctx.stroke();
      // Eye glow
      ctx.fillStyle = '#ff8822';
      ctx.shadowColor = '#ff8822'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'bomb_bug') {
      // Round body with fuse + legs
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      const bg2 = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r);
      bg2.addColorStop(0, this._lightenColor(color, 0.45));
      bg2.addColorStop(1, this._darkenColor(color, 0.45));
      ctx.fillStyle = bg2;
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.82, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Fuse
      ctx.strokeStyle = '#888866'; ctx.lineWidth = Math.max(1.5, r * 0.13); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.7); ctx.quadraticCurveTo(r * 0.45, -r * 1.2, r * 0.1, -r * 1.35); ctx.stroke();
      // Spark at fuse tip
      ctx.fillStyle = '#ffff44';
      ctx.shadowColor = '#ffff44'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 1.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
      // Legs
      ctx.shadowBlur = 0;
      ctx.strokeStyle = this._darkenColor(color, 0.3); ctx.lineWidth = Math.max(1.5, r * 0.12);
      for (const [lx, ly, lx2, ly2] of [[-r*0.6, r*0.2, -r*1.0, r*0.55], [-r*0.55, r*0.5, -r*0.88, r*0.82],
                                          [r*0.6, r*0.2, r*1.0, r*0.55], [r*0.55, r*0.5, r*0.88, r*0.82]]) {
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx2, ly2); ctx.stroke();
      }
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.05, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.22, -r * 0.05, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.26, -r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'necromancer') {
      // Hooded robe with skull staff
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      // Robe (wide base tapering up)
      const robeG = ctx.createLinearGradient(0, r, 0, -r * 0.8);
      robeG.addColorStop(0, this._darkenColor(color, 0.5));
      robeG.addColorStop(0.5, color);
      robeG.addColorStop(1, this._lightenColor(color, 0.25));
      ctx.fillStyle = robeG;
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, r * 0.95);
      ctx.lineTo(-r * 0.52, -r * 0.2);
      ctx.lineTo(0, -r * 0.88);
      ctx.lineTo(r * 0.52, -r * 0.2);
      ctx.lineTo(r * 0.85, r * 0.95);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // Hood (dark circle top)
      ctx.fillStyle = this._darkenColor(color, 0.45);
      ctx.beginPath(); ctx.arc(0, -r * 0.6, r * 0.42, 0, Math.PI * 2); ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#44ffaa';
      ctx.shadowColor = '#44ffaa'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.6, r * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.12, -r * 0.6, r * 0.09, 0, Math.PI * 2); ctx.fill();
      // Orbiting minion-sprite dots
      ctx.shadowBlur = 4;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + this.menuTime * 2.2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (id === 'shielder') {
      // Large tower shield as body
      ctx.shadowColor = color; ctx.shadowBlur = 12;
      // Shield body
      const shG = ctx.createLinearGradient(-r * 0.7, -r, r * 0.3, r);
      shG.addColorStop(0, this._lightenColor(color, 0.5));
      shG.addColorStop(0.5, color);
      shG.addColorStop(1, this._darkenColor(color, 0.4));
      ctx.fillStyle = shG;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.95);
      ctx.lineTo(-r * 0.75, r * 0.42);
      ctx.lineTo(-r * 0.78, -r * 0.55);
      ctx.lineTo(0, -r * 0.98);
      ctx.lineTo(r * 0.78, -r * 0.55);
      ctx.lineTo(r * 0.75, r * 0.42);
      ctx.closePath(); ctx.fill();
      // Shield boss (center knob)
      ctx.shadowBlur = 0;
      ctx.fillStyle = this._lightenColor(color, 0.3);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
      // Cross
      ctx.strokeStyle = this._lightenColor(color, 0.55);
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.72); ctx.lineTo(0, r * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.05); ctx.lineTo(r * 0.55, -r * 0.05); ctx.stroke();
      // Peeking helmet above shield
      ctx.fillStyle = this._lightenColor(color, 0.15);
      ctx.beginPath(); ctx.arc(0, -r * 0.82, r * 0.22, Math.PI, 0); ctx.fill();

    } else if (id === 'healer') {
      // Monk: cross on robe
      ctx.shadowColor = color; ctx.shadowBlur = 12;
      // Robe body
      const healG = ctx.createRadialGradient(-r * 0.15, -r * 0.1, 0, 0, r * 0.2, r * 1.05);
      healG.addColorStop(0, this._lightenColor(color, 0.5));
      healG.addColorStop(1, this._darkenColor(color, 0.35));
      ctx.fillStyle = healG;
      ctx.beginPath(); ctx.ellipse(0, r * 0.28, r * 0.65, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Head
      ctx.fillStyle = '#ffddbb';
      ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.32, 0, Math.PI * 2); ctx.fill();
      // Halo
      ctx.strokeStyle = '#ffee44'; ctx.lineWidth = Math.max(1.5, r * 0.1);
      ctx.shadowColor = '#ffee44'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(0, -r * 0.38, r * 0.45, 0, Math.PI * 2); ctx.stroke();
      // Cross on robe
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, r * 0.2);
      ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.25); ctx.lineTo(r * 0.35, r * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, r * 0.0); ctx.lineTo(0, r * 0.55); ctx.stroke();

    } else if (id === 'dasher') {
      // Sleek elongated body with speed-trail
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      // Speed trail
      ctx.globalAlpha = 0.25;
      for (let i = 1; i <= 3; i++) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(-r * i * 0.55, 0, r * (0.55 - i * 0.1), r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Main body (horizontal elongated)
      const dashG = ctx.createLinearGradient(-r * 0.8, -r * 0.4, r * 0.8, r * 0.4);
      dashG.addColorStop(0, this._lightenColor(color, 0.45));
      dashG.addColorStop(1, this._darkenColor(color, 0.45));
      ctx.fillStyle = dashG;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.88, r * 0.52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Visor (eye slit)
      ctx.fillStyle = '#ffee22';
      ctx.shadowColor = '#ffee22'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.ellipse(r * 0.38, 0, r * 0.26, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      // Spike claws
      ctx.shadowBlur = 0;
      ctx.strokeStyle = this._lightenColor(color, 0.3); ctx.lineWidth = Math.max(1.5, r * 0.12);
      for (const [cx2, cy2, ex, ey] of [[r * 0.7, -r * 0.3, r * 1.05, -r * 0.55],
                                          [r * 0.7, r * 0.3, r * 1.05, r * 0.55]]) {
        ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(ex, ey); ctx.stroke();
      }

    } else if (id === 'boss_demon') {
      // Demon: wide horned head + wings
      ctx.shadowColor = color; ctx.shadowBlur = 22;
      // Wings
      const wingG = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
      wingG.addColorStop(0, this._lightenColor(color, 0.2));
      wingG.addColorStop(1, this._darkenColor(color, 0.6));
      ctx.fillStyle = wingG;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.1);
      ctx.bezierCurveTo(-r * 1.3, -r * 1.2, -r * 2.0, -r * 0.6, -r * 1.8, r * 0.8);
      ctx.bezierCurveTo(-r * 1.5, r * 1.1, -r * 0.8, r * 0.8, -r * 0.55, r * 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r * 0.1);
      ctx.bezierCurveTo(r * 1.3, -r * 1.2, r * 2.0, -r * 0.6, r * 1.8, r * 0.8);
      ctx.bezierCurveTo(r * 1.5, r * 1.1, r * 0.8, r * 0.8, r * 0.55, r * 0.55);
      ctx.fill();
      // Body
      const bodyG = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 0, 0, 0, r * 0.9);
      bodyG.addColorStop(0, this._lightenColor(color, 0.45));
      bodyG.addColorStop(0.5, color);
      bodyG.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = bodyG;
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.65, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
      // Head
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -r * 0.42, r * 0.52, 0, Math.PI * 2); ctx.fill();
      // Horns
      ctx.fillStyle = this._darkenColor(color, 0.35);
      ctx.beginPath(); ctx.moveTo(-r * 0.38, -r * 0.78); ctx.lineTo(-r * 0.58, -r * 1.35); ctx.lineTo(-r * 0.15, -r * 0.82); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.38, -r * 0.78); ctx.lineTo(r * 0.58, -r * 1.35); ctx.lineTo(r * 0.15, -r * 0.82); ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
      // Fanged mouth
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r * 0.28, -r * 0.22); ctx.lineTo(r * 0.28, -r * 0.22); ctx.stroke();
      for (const fx of [-r * 0.2, -r * 0.06, r * 0.08, r * 0.22]) {
        ctx.beginPath(); ctx.moveTo(fx, -r * 0.22); ctx.lineTo(fx + r * 0.04, -r * 0.06); ctx.stroke();
      }

    } else if (id === 'boss_lich') {
      // Lich: skull with crown + floating robe
      ctx.shadowColor = color; ctx.shadowBlur = 20;
      // Floating robe (ethereal)
      ctx.globalAlpha = 0.7;
      const lichG = ctx.createLinearGradient(0, -r * 0.4, 0, r * 1.1);
      lichG.addColorStop(0, this._lightenColor(color, 0.3));
      lichG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lichG;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, r * 1.1);
      ctx.lineTo(-r * 0.45, -r * 0.2);
      ctx.lineTo(r * 0.45, -r * 0.2);
      ctx.lineTo(r * 0.72, r * 1.1);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // Skull body
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.62, 0, Math.PI * 2); ctx.fill();
      // Jaw
      ctx.fillStyle = this._darkenColor(color, 0.2);
      ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.45, 0, Math.PI); ctx.fill();
      // Eye sockets (glowing)
      ctx.fillStyle = '#44ffaa';
      ctx.shadowColor = '#44ffaa'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(-r * 0.24, -r * 0.18, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.24, -r * 0.18, r * 0.18, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, -r * 0.62);
      for (const [cx3, cy3] of [[-r*0.44, -r*1.12], [-r*0.22, -r*0.72], [0, -r*1.22],
                                  [r*0.22, -r*0.72], [r*0.44, -r*1.12], [r*0.62, -r*0.62]]) {
        ctx.lineTo(cx3, cy3);
      }
      ctx.closePath(); ctx.fill();
      // Teeth
      ctx.fillStyle = this._darkenColor(color, 0.4);
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * r * 0.2 - r * 0.08, r * 0.16, r * 0.14, r * 0.2);
      }

    } else if (id === 'boss_dragon') {
      // Dragon: scaly head + wings + tail
      ctx.shadowColor = color; ctx.shadowBlur = 24;
      // Wings
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = this._darkenColor(color, 0.3);
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.bezierCurveTo(-r * 1.5, -r * 1.5, -r * 2.5, -r * 0.8, -r * 2.2, r * 0.6);
      ctx.bezierCurveTo(-r * 1.8, r * 1.0, -r * 0.9, r * 0.7, -r * 0.6, r * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.6, 0);
      ctx.bezierCurveTo(r * 1.5, -r * 1.5, r * 2.5, -r * 0.8, r * 2.2, r * 0.6);
      ctx.bezierCurveTo(r * 1.8, r * 1.0, r * 0.9, r * 0.7, r * 0.6, r * 0.5);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Body
      const dBodyG = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 0, 0, 0, r);
      dBodyG.addColorStop(0, this._lightenColor(color, 0.5));
      dBodyG.addColorStop(0.5, color);
      dBodyG.addColorStop(1, this._darkenColor(color, 0.5));
      ctx.fillStyle = dBodyG;
      ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.72, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      // Head (wide + snout)
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.65, r * 0.62, r * 0.48, 0, 0, Math.PI * 2); ctx.fill();
      // Snout
      ctx.fillStyle = this._lightenColor(color, 0.2);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.38, r * 0.4, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      // Horns
      ctx.fillStyle = this._darkenColor(color, 0.4);
      ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.95); ctx.lineTo(-r * 0.65, -r * 1.45); ctx.lineTo(-r * 0.28, -r * 1.0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.95); ctx.lineTo(r * 0.65, -r * 1.45); ctx.lineTo(r * 0.28, -r * 1.0); ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff4400';
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(-r * 0.26, -r * 0.7, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.26, -r * 0.7, r * 0.14, 0, Math.PI * 2); ctx.fill();
      // Fire breath dots
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8800';
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 1 - i * 0.25;
        ctx.beginPath(); ctx.arc(0, -r * 0.1 + i * r * 0.35, r * (0.14 - i * 0.02), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

    } else {
      // ── Fallback: colored sphere with directional triangle ─────────────────
      this._drawSphere(0, 0, r, color);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = Math.max(1, r * 0.13);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.52); ctx.lineTo(r * 0.36, r * 0.32); ctx.lineTo(-r * 0.36, r * 0.32);
      ctx.closePath(); ctx.stroke();
    }

    ctx.restore();
  }

  // ── Pickup sprites ────────────────────────────────────────────────────────
  _drawGemSprite(sx, sy, r) {
    const ctx = this.ctx;
    const h = r * 1.15;
    const w = h * 0.62;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(-w, -h, w, h);
    g.addColorStop(0, '#aaeeff');
    g.addColorStop(0.38, '#00ccff');
    g.addColorStop(1, '#0055bb');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w, -h * 0.18);
    ctx.lineTo(w, h * 0.18);
    ctx.lineTo(0, h);
    ctx.lineTo(-w, h * 0.18);
    ctx.lineTo(-w, -h * 0.18);
    ctx.closePath();
    ctx.fill();
    // Inner facet
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.6); ctx.lineTo(w * 0.72, 0);
    ctx.lineTo(0, h * 0.6); ctx.lineTo(-w * 0.72, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  _drawHeartSprite(sx, sy, r, large = false) {
    const ctx = this.ctx;
    const s = r * (large ? 1.1 : 0.78);
    ctx.save();
    ctx.translate(sx, sy - s * 0.1);
    ctx.shadowColor = '#ff4488';
    ctx.shadowBlur = large ? 14 : 8;
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s * 1.5);
    g.addColorStop(0, '#ff99cc');
    g.addColorStop(0.5, '#ff2266');
    g.addColorStop(1, '#aa0044');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.34);
    ctx.bezierCurveTo(s * 0.98, -s * 0.28, s * 1.08, -s * 1.08, 0, -s * 0.58);
    ctx.bezierCurveTo(-s * 1.08, -s * 1.08, -s * 0.98, -s * 0.28, 0, s * 0.34);
    ctx.fill();
    ctx.restore();
  }

  _drawPotionSprite(sx, sy, r) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur = 10;
    // Body (large rounded oval)
    const g = ctx.createRadialGradient(-r * 0.22, r * 0.05, 0, r * 0.1, r * 0.25, r * 1.05);
    g.addColorStop(0, '#aaffcc');
    g.addColorStop(0.45, '#22cc66');
    g.addColorStop(1, '#115533');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.72, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck
    ctx.fillStyle = '#33dd77';
    ctx.fillRect(-r * 0.22, -r * 0.54, r * 0.44, r * 0.48);
    // Cork
    ctx.fillStyle = '#cc9944';
    this._roundRect(-r * 0.26, -r * 0.72, r * 0.52, r * 0.22, 2);
    ctx.fill();
    // Shine
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.22, r * 0.06, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Chest sprite ──────────────────────────────────────────────────────────
  _drawChestSprite(sx, sy, r) {
    const ctx = this.ctx;
    const w = r * 2.1;
    const h = r * 1.55;
    const lidH = h * 0.42;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 14;
    // Body
    this._roundRect(-w / 2, -h / 2 + lidH, w, h - lidH, 3);
    ctx.fillStyle = '#7a4a1a';
    ctx.fill();
    ctx.strokeStyle = '#cc9922';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lid
    this._roundRect(-w / 2, -h / 2, w, lidH + 2, 3);
    ctx.fillStyle = '#9a6022';
    ctx.fill();
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Gold clasp
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffdd44';
    this._roundRect(-r * 0.22, -r * 0.2, r * 0.44, r * 0.38, 3);
    ctx.fill();
    // Hinge line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#cc9922';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, -h / 2 + lidH + 1);
    ctx.lineTo(w / 2 - 3, -h / 2 + lidH + 1);
    ctx.stroke();
    ctx.restore();
  }

  // ── Barrel sprite ─────────────────────────────────────────────────────────
  _drawBarrelSprite(sx, sy, r) {
    const ctx = this.ctx;
    const bw = r * 1.75;
    const bh = r * 2.1;
    ctx.save();
    ctx.translate(sx, sy);
    // Body
    const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    g.addColorStop(0, '#3a2010');
    g.addColorStop(0.3, '#8a5a28');
    g.addColorStop(0.7, '#8a5a28');
    g.addColorStop(1, '#3a2010');
    ctx.fillStyle = g;
    this._roundRect(-bw / 2, -bh / 2, bw, bh, bw * 0.18);
    ctx.fill();
    // Metal bands (top, middle, bottom)
    ctx.strokeStyle = '#777766';
    ctx.lineWidth = r * 0.22;
    for (const by of [-bh * 0.32, 0, bh * 0.32]) {
      ctx.beginPath();
      ctx.ellipse(0, by, bw / 2, bw * 0.11, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Wood grain
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const gx = i * bw * 0.15;
      ctx.beginPath();
      ctx.moveTo(gx, -bh / 2 + 5); ctx.lineTo(gx, bh / 2 - 5); ctx.stroke();
    }
    ctx.restore();
  }

  // ── Skill icon (for level-up cards & HUD) — unique symbol per skill ID ─────
  _drawSkillIcon(sx, sy, r, skill) {
    const ctx = this.ctx;
    const id = skill.id || '';
    const cat = skill.pool || skill.category || 'passive';

    // Background color by category
    const bgColor = cat === 'archero' ? '#1a3a88'
      : cat === 'weapon' ? '#4a1a77'
      : '#1a3322';
    const glowColor = cat === 'archero' ? '#4488ff'
      : cat === 'weapon' ? '#cc44ff'
      : '#44cc88';

    ctx.save();
    ctx.translate(sx, sy);

    // Background circle
    const bg = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r);
    bg.addColorStop(0, this._lightenColor(bgColor, 0.35));
    bg.addColorStop(1, bgColor);
    ctx.fillStyle = bg;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = r * 0.7;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Border ring
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = Math.max(0.8, r * 0.09);
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lw = Math.max(1, r * 0.14);
    ctx.lineWidth = lw;

    // ── Per-skill symbols ──
    if (id === 'skill_diagonal') {
      // Two diagonal arrows (↗ and ↙)
      for (const [dx, dy] of [[1, -1], [-1, 1]]) {
        const ox = dx * r * 0.3, oy = dy * r * 0.3;
        ctx.beginPath();
        ctx.moveTo(ox - dx * r * 0.38, oy - dy * r * 0.38);
        ctx.lineTo(ox + dx * r * 0.38, oy + dy * r * 0.38);
        ctx.stroke();
        // Arrowhead
        const ax = ox + dx * r * 0.38, ay = oy + dy * r * 0.38;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - dx * r * 0.22, ay);
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, ay - dy * r * 0.22);
        ctx.stroke();
      }

    } else if (id === 'skill_side_arrow') {
      // Left arrow and right arrow
      for (const dir of [-1, 1]) {
        const ox = dir * r * 0.35;
        ctx.beginPath(); ctx.moveTo(ox - dir * r * 0.3, 0); ctx.lineTo(ox + dir * r * 0.05, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox + dir * r * 0.05, 0);
        ctx.lineTo(ox - dir * r * 0.12, -r * 0.2);
        ctx.moveTo(ox + dir * r * 0.05, 0);
        ctx.lineTo(ox - dir * r * 0.12, r * 0.2);
        ctx.stroke();
      }

    } else if (id === 'skill_back_arrow') {
      // A curved back arrow (↩)
      ctx.beginPath();
      ctx.arc(r * 0.05, r * 0.05, r * 0.38, -Math.PI * 0.9, Math.PI * 0.1);
      ctx.stroke();
      // Arrowhead at start
      ctx.beginPath();
      ctx.moveTo(-r * 0.38, -r * 0.28);
      ctx.lineTo(-r * 0.56, -r * 0.05);
      ctx.moveTo(-r * 0.38, -r * 0.28);
      ctx.lineTo(-r * 0.16, -r * 0.18);
      ctx.stroke();

    } else if (id === 'skill_multishot') {
      // Fan of 3 arrows
      for (const angle of [-0.45, 0, 0.45]) {
        ctx.save(); ctx.rotate(angle - Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, r * 0.55); ctx.lineTo(0, -r * 0.55); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.18, -r * 0.25);
        ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.18, -r * 0.25);
        ctx.stroke();
        ctx.restore();
      }

    } else if (id === 'skill_bounce') {
      // Arrow + wall bounce line
      ctx.beginPath(); ctx.moveTo(-r * 0.65, r * 0.4); ctx.lineTo(0, -r * 0.4); ctx.lineTo(r * 0.65, r * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.55); ctx.lineTo(-r * 0.75, r * 0.55); ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(r * 0.65, r * 0.4); ctx.lineTo(r * 0.42, r * 0.18);
      ctx.moveTo(r * 0.65, r * 0.4); ctx.lineTo(r * 0.65, r * 0.1);
      ctx.stroke();

    } else if (id === 'skill_ricochet') {
      // Target circle with arrow pointing at it
      ctx.lineWidth = Math.max(0.7, lw * 0.7);
      ctx.beginPath(); ctx.arc(r * 0.2, r * 0.15, r * 0.32, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.2, r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(-r * 0.68, -r * 0.52); ctx.lineTo(r * 0.0, r * 0.05); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.05, r * 0.05); ctx.lineTo(-r * 0.28, -r * 0.1);
      ctx.moveTo(-r * 0.05, r * 0.05); ctx.lineTo(-r * 0.2, r * 0.28);
      ctx.stroke();

    } else if (id === 'skill_freeze') {
      // Snowflake: 6 spokes + cross-ticks
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate((i / 6) * Math.PI * 2);
        ctx.beginPath(); ctx.moveTo(0, -r * 0.62); ctx.lineTo(0, r * 0.62); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.22, -r * 0.3); ctx.lineTo(r * 0.22, -r * 0.3);
        ctx.moveTo(-r * 0.22, r * 0.3); ctx.lineTo(r * 0.22, r * 0.3);
        ctx.stroke();
        ctx.restore();
      }

    } else if (id === 'skill_poison') {
      // Skull shape
      ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.42, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-r * 0.38, r * 0.24, r * 0.24, r * 0.22);
      ctx.fillRect(r * 0.14, r * 0.24, r * 0.24, r * 0.22);
      // Eye holes
      ctx.fillStyle = bgColor;
      ctx.beginPath(); ctx.arc(-r * 0.16, -r * 0.12, r * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.16, -r * 0.12, r * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';

    } else if (id === 'skill_heal_on_kill') {
      // Blood drop / teardrop
      ctx.beginPath();
      ctx.moveTo(0, r * 0.58);
      ctx.bezierCurveTo(r * 0.55, r * 0.15, r * 0.48, -r * 0.55, 0, -r * 0.55);
      ctx.bezierCurveTo(-r * 0.48, -r * 0.55, -r * 0.55, r * 0.15, 0, r * 0.58);
      ctx.fill();
      // Shine
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.18, r * 0.13, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'skill_thorns') {
      // Spiky star (8 points alternating)
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.62 : r * 0.28;
        i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
                : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.stroke();

    } else if (id === 'skill_vampire') {
      // Bat wings silhouette
      ctx.beginPath();
      ctx.moveTo(0, r * 0.1);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.3, -r * 0.72, -r * 0.42, -r * 0.68, r * 0.22);
      ctx.bezierCurveTo(-r * 0.55, r * 0.5, -r * 0.18, r * 0.52, 0, r * 0.18);
      ctx.bezierCurveTo(r * 0.18, r * 0.52, r * 0.55, r * 0.5, r * 0.68, r * 0.22);
      ctx.bezierCurveTo(r * 0.72, -r * 0.42, r * 0.3, -r * 0.3, 0, r * 0.1);
      ctx.fill();
      // Fangs
      ctx.fillStyle = bgColor;
      ctx.beginPath(); ctx.arc(0, -r * 0.08, r * 0.14, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'skill_heal_potion' || id === 'skill_max_hp_up' || id === 'passive_max_hp') {
      // Heart
      ctx.beginPath();
      ctx.moveTo(0, r * 0.35);
      ctx.bezierCurveTo(r * 0.62, -r * 0.12, r * 0.68, -r * 0.72, 0, -r * 0.42);
      ctx.bezierCurveTo(-r * 0.68, -r * 0.72, -r * 0.62, -r * 0.12, 0, r * 0.35);
      ctx.fill();

    } else if (id === 'skill_arrow' || id === 'skill_multishot') {
      // Arrow pointing up
      ctx.beginPath(); ctx.moveTo(0, r * 0.62); ctx.lineTo(0, -r * 0.62); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.62); ctx.lineTo(-r * 0.3, -r * 0.22);
      ctx.moveTo(0, -r * 0.62); ctx.lineTo(r * 0.3, -r * 0.22);
      ctx.stroke();
      // Notch
      ctx.fillRect(-r * 0.06, r * 0.38, r * 0.12, r * 0.2);

    } else if (id === 'skill_magic_orb') {
      // Orbiting orbs
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const ox = Math.cos(a) * r * 0.42, oy = Math.sin(a) * r * 0.42;
        ctx.beginPath(); ctx.arc(ox, oy, r * 0.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'skill_lightning') {
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(r * 0.18, -r * 0.65);
      ctx.lineTo(-r * 0.12, -r * 0.02);
      ctx.lineTo(r * 0.12, -r * 0.02);
      ctx.lineTo(-r * 0.18, r * 0.65);
      ctx.stroke();

    } else if (id === 'skill_fire_circle') {
      // Flame shape
      ctx.beginPath();
      ctx.moveTo(0, r * 0.65);
      ctx.bezierCurveTo(r * 0.55, r * 0.35, r * 0.55, -r * 0.15, r * 0.08, -r * 0.28);
      ctx.bezierCurveTo(r * 0.35, -r * 0.62, 0, -r * 0.72, 0, -r * 0.72);
      ctx.bezierCurveTo(0, -r * 0.72, -r * 0.35, -r * 0.62, -r * 0.08, -r * 0.28);
      ctx.bezierCurveTo(-r * 0.55, -r * 0.15, -r * 0.55, r * 0.35, 0, r * 0.65);
      ctx.fill();

    } else if (id === 'skill_boomerang') {
      // Curved boomerang shape
      ctx.lineWidth = lw * 1.3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.5);
      ctx.quadraticCurveTo(0, -r * 0.9, r * 0.6, r * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.5);
      ctx.lineTo(-r * 0.28, r * 0.28);
      ctx.moveTo(r * 0.6, r * 0.5);
      ctx.lineTo(r * 0.28, r * 0.28);
      ctx.stroke();

    } else if (id === 'skill_holy_sword') {
      // Sword pointing up
      ctx.beginPath(); ctx.moveTo(0, -r * 0.72); ctx.lineTo(0, r * 0.45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.38, -r * 0.22); ctx.lineTo(r * 0.38, -r * 0.22); ctx.stroke();
      // Pommel
      ctx.beginPath(); ctx.arc(0, r * 0.5, r * 0.12, 0, Math.PI * 2); ctx.fill();

    } else if (id === 'passive_speed') {
      // Three horizontal speed lines
      for (let k = -1; k <= 1; k++) {
        const oy = k * r * 0.3;
        const len = k === 0 ? r * 0.7 : r * 0.45;
        ctx.beginPath(); ctx.moveTo(-len, oy); ctx.lineTo(len, oy); ctx.stroke();
      }
      // Arrowhead right
      ctx.beginPath();
      ctx.moveTo(r * 0.68, 0); ctx.lineTo(r * 0.38, -r * 0.22);
      ctx.moveTo(r * 0.68, 0); ctx.lineTo(r * 0.38, r * 0.22);
      ctx.stroke();

    } else if (id === 'passive_damage') {
      // 6-point burst star
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.65 : r * 0.28;
        i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
                : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill();

    } else if (id === 'passive_cooldown') {
      // Clock: circle + hands
      ctx.lineWidth = Math.max(0.8, lw * 0.8);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.32, r * 0.18); ctx.stroke();

    } else if (id === 'passive_armor') {
      // Shield shape
      ctx.beginPath();
      ctx.moveTo(0, r * 0.7);
      ctx.lineTo(-r * 0.55, r * 0.28);
      ctx.lineTo(-r * 0.55, -r * 0.32);
      ctx.lineTo(0, -r * 0.68);
      ctx.lineTo(r * 0.55, -r * 0.32);
      ctx.lineTo(r * 0.55, r * 0.28);
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.42); ctx.lineTo(0, r * 0.45); ctx.stroke();

    } else if (id === 'passive_regen') {
      // Green cross
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(-r * 0.55, -r * 0.18, r * 1.1, r * 0.36);
      ctx.fillRect(-r * 0.18, -r * 0.55, r * 0.36, r * 1.1);

    } else if (id === 'passive_pickup_range') {
      // Magnet shape (U with ends)
      ctx.lineWidth = lw * 1.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.55);
      ctx.lineTo(-r * 0.45, r * 0.1);
      ctx.arc(0, r * 0.1, r * 0.45, Math.PI, 0);
      ctx.lineTo(r * 0.45, -r * 0.55);
      ctx.stroke();
      // Tips (red/blue)
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-r * 0.58, -r * 0.68, r * 0.26, r * 0.2);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(r * 0.32, -r * 0.68, r * 0.26, r * 0.2);

    } else if (id === 'passive_exp_bonus') {
      // Star (5-point)
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.65 : r * 0.28;
        i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
                : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill();

    } else {
      // Fallback: generic icon based on category letter
      ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat === 'weapon' ? '⚔' : cat === 'archero' ? '✦' : '★', 0, 0);
    }

    ctx.restore();
  }

  // Draw a rounded-rectangle path (call fill/stroke after)
  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Draw twinkling starfield (for menu backgrounds)
  drawStarfield(canvas) {
    const ctx = this.ctx;
    for (const s of this.stars) {
      const screenX = s.x * canvas.width;
      const screenY = s.y * canvas.height;
      const alpha = s.alpha * (0.55 + Math.sin(this.menuTime * 1.8 + s.twinkle) * 0.45);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(camera) {
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMap(camera) {
    const ctx = this.ctx;
    const cfg = CONFIG;
    const map = cfg.map;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ox = camera ? camera.x : 0;
    const oy = camera ? camera.y : 0;

    // Floor fill (already done by clear())

    // Grid lines
    ctx.strokeStyle = map.gridColor;
    ctx.lineWidth = 1;
    const startGridX = Math.floor(ox / map.gridSize) * map.gridSize;
    const startGridY = Math.floor(oy / map.gridSize) * map.gridSize;
    for (let gx = startGridX; gx < ox + w + map.gridSize; gx += map.gridSize) {
      const sx = gx - ox;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = startGridY; gy < oy + h + map.gridSize; gy += map.gridSize) {
      const sy = gy - oy;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Map border
    const bx = -ox;
    const by = -oy;
    ctx.strokeStyle = map.borderColor;
    ctx.lineWidth = map.borderWidth;
    ctx.strokeRect(bx, by, map.width, map.height);
  }

  drawRoom(roomManager, camera) {
    const ctx = this.ctx;
    const room = CONFIG.room;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const wall = room.wallThickness;

    // Floor fill
    ctx.fillStyle = room.floorColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle stone tile grid on floor
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const tileSize = 48;
    for (let tx = wall; tx < w - wall; tx += tileSize) {
      ctx.beginPath(); ctx.moveTo(tx, wall); ctx.lineTo(tx, h - wall); ctx.stroke();
    }
    for (let ty = wall; ty < h - wall; ty += tileSize) {
      ctx.beginPath(); ctx.moveTo(wall, ty); ctx.lineTo(w - wall, ty); ctx.stroke();
    }

    // 4 wall rectangles
    ctx.fillStyle = room.wallColor;
    ctx.fillRect(0, 0, w, wall);          // top
    ctx.fillRect(0, h - wall, w, wall);   // bottom
    ctx.fillRect(0, 0, wall, h);          // left
    ctx.fillRect(w - wall, 0, wall, h);   // right

    // Door gap in top wall (when door is open)
    if (roomManager.doorOpen) {
      const doorW = room.doorWidth;
      const doorX = (w - doorW) / 2;
      ctx.fillStyle = room.floorColor;
      ctx.fillRect(doorX, 0, doorW, wall);
    }
  }

  drawDoor(roomManager, elapsed) {
    if (!roomManager.doorOpen) return;
    const ctx = this.ctx;
    const room = CONFIG.room;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const wall = room.wallThickness;
    const doorW = room.doorWidth;
    const doorH = room.doorHeight;
    const doorX = (w - doorW) / 2;
    const doorY = wall - doorH / 2;

    const anim = roomManager.doorAnim;
    const pulse = 0.6 + Math.sin(elapsed * 5) * 0.4;

    // Outer glow
    ctx.save();
    ctx.globalAlpha = anim * pulse * 0.35;
    ctx.fillStyle = room.doorColor;
    ctx.fillRect(doorX - 10, doorY - 6, doorW + 20, doorH + 12);
    ctx.restore();

    // Door fill
    ctx.save();
    ctx.globalAlpha = 0.4 + anim * 0.6;
    ctx.fillStyle = room.doorColor;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.restore();

    // Inner shimmer border
    ctx.save();
    ctx.globalAlpha = anim * pulse;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX + 2, doorY + 2, doorW - 4, doorH - 4);
    ctx.restore();

    // "NEXT" label on door
    if (anim >= 1) {
      ctx.save();
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', w / 2, doorY + doorH / 2 + 5);
      ctx.restore();
    }

    // Pulsing arrow indicator in center of room pointing toward door
    if (anim >= 1) {
      const arrowX = w / 2;
      const arrowY = h * 0.35;
      const bounce = Math.sin(elapsed * 4) * 6;
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(elapsed * 4) * 0.3;
      ctx.fillStyle = room.doorColor;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 14 + bounce);
      ctx.lineTo(arrowX - 14, arrowY + 6 + bounce);
      ctx.lineTo(arrowX - 5, arrowY + 6 + bounce);
      ctx.lineTo(arrowX - 5, arrowY + 20 + bounce);
      ctx.lineTo(arrowX + 5, arrowY + 20 + bounce);
      ctx.lineTo(arrowX + 5, arrowY + 6 + bounce);
      ctx.lineTo(arrowX + 14, arrowY + 6 + bounce);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawChapterHUD(roomManager) {
    const ctx = this.ctx;
    const chapter = roomManager.currentChapter;
    if (!chapter) return;

    const roomNum = roomManager.roomIndex + 1;
    const totalRooms = chapter.rooms.length;
    const cx = this.canvas.width / 2;

    // Chapter / Room text (top-center, below time)
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`第${chapter.id}章 ${chapter.name}  房間 ${roomNum}/${totalRooms}`, cx, 75);

    // Progress dots
    const dotR = 4;
    const dotGap = 12;
    const totalDotsW = totalRooms * dotGap;
    let dotX = cx - totalDotsW / 2;
    const dotY = 88;

    for (let i = 0; i < totalRooms; i++) {
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      if (i < roomManager.roomIndex) {
        ctx.fillStyle = '#ffdd44'; // completed
      } else if (i === roomManager.roomIndex) {
        ctx.fillStyle = '#ffffff'; // current
      } else {
        ctx.fillStyle = '#444466'; // pending
      }
      ctx.fill();
      dotX += dotGap;
    }
  }

  drawRoomClearPanel(skillChoices, canvas) {
    this._drawSkillCards(skillChoices, canvas, '房間通關！選擇技能');
  }

  drawChapterClear(canvas, chapterNum, runGold) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`第${chapterNum}章 通關！`, cx, cy - 80);

    ctx.fillStyle = '#44dd44';
    ctx.font = '20px monospace';
    ctx.fillText('恭喜！下一章節已解鎖', cx, cy - 40);

    ctx.fillStyle = '#ffdd44';
    ctx.font = '18px monospace';
    ctx.fillText(`獲得金幣: ${Math.floor(runGold || 0)}`, cx, cy + 10);

    ctx.fillStyle = '#44aaff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('點擊返回章節選擇', cx, cy + 70);
  }

  drawChests(chests, camera, elapsed) {
    const ctx = this.ctx;
    for (const chest of chests) {
      if (chest.alive === false) continue;
      const sx = chest.x - camera.x;
      const sy = chest.y - camera.y;
      const pulse = Math.sin(elapsed * 3) * 1;
      const r = chest.radius + pulse;
      this._drawChestSprite(sx, sy, r);
      // Subtle glow ring when not yet opened
      ctx.globalAlpha = 0.3 + Math.sin(elapsed * 3) * 0.15;
      ctx.strokeStyle = '#ffdd44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, chest.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBarrels(barrels, camera) {
    for (const barrel of barrels) {
      if (!barrel.alive) continue;
      const sx = barrel.x - camera.x;
      const sy = barrel.y - camera.y;
      this._drawBarrelSprite(sx, sy, barrel.radius);
    }
  }

  drawPlayer(player, camera, elapsed = 0) {
    const ctx = this.ctx;
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    // Skip drawing if invincible and in blink phase
    if (player.invincible && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      return;
    }

    const pulse = Math.sin(elapsed * 3) * 1;
    const r = player.radius + pulse;

    // Custom player sprite (replaces emoji)
    this._drawPlayerSprite(sx, sy, r, player);

    // Hit flash overlay
    if (player.hitFlashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, player.hitFlashTimer * 6.5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawEnemies(enemies, camera, elapsed = 0) {
    const ctx = this.ctx;
    for (const e of enemies) {
      if (!e.alive) continue;
      const sx = e.x - camera.x;
      const sy = e.y - camera.y;

      // Skip if off screen
      if (sx < -50 || sx > this.canvas.width + 50 || sy < -50 || sy > this.canvas.height + 50) continue;

      const pulse = Math.sin(elapsed * 3 + e.x * 0.1) * 1;
      const r = e.radius + pulse;

      // Custom enemy sprite (replaces emoji)
      this._drawEnemySprite(sx, sy, r, e);

      // Hit flash overlay
      if (e.hitFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.7, e.hitFlashTimer * 7);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Frozen overlay — icy sheen
      if (e.frozen > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, e.frozen * 0.4);
        ctx.fillStyle = '#88ddff';
        ctx.beginPath();
        ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aaeeff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Poisoned — volumetric toxic smoke cloud
      if (e.poisoned > 0) {
        const intensity = Math.min(1, e.poisoned * 0.4);
        const t = this.menuTime;
        this._drawPoisonSmoke(ctx, sx, sy, r, intensity, t);
      }

      // HP bar (only if damaged)
      if (e.hp < e.maxHp) {
        const barW = e.radius * 2.4;
        const barH = 3;
        const barY = sy - r - 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(sx - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
      }
    }
  }

  drawProjectiles(projectiles, camera, elapsed = 0) {
    const ctx = this.ctx;
    const t = this.menuTime;

    for (const p of projectiles) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      if (p.isBoomerang) {
        // ── Animated boomerang ──────────────────────────────────────────────
        const r = p.radius;
        const spin = t * 14; // fast spin
        const travelAngle = Math.atan2(p.vy || 0, p.vx || 0);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(travelAngle + spin);

        // Motion trail (3 fading ghost copies)
        for (let i = 1; i <= 3; i++) {
          ctx.save();
          ctx.globalAlpha = 0.18 - i * 0.04;
          ctx.rotate(-i * 0.45);
          ctx.scale(1 - i * 0.1, 1 - i * 0.1);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-r * 1.6, 0);
          ctx.quadraticCurveTo(0, -r * 1.2, r * 1.6, 0);
          ctx.quadraticCurveTo(0, r * 0.5, -r * 1.6, 0);
          ctx.fill();
          ctx.restore();
        }

        // Boomerang wing shape
        const bColor = p.color;
        const bGrad = ctx.createLinearGradient(-r * 1.6, -r * 0.4, r * 1.6, r * 0.4);
        bGrad.addColorStop(0, this._lightenColor(bColor, 0.5));
        bGrad.addColorStop(0.5, bColor);
        bGrad.addColorStop(1, this._lightenColor(bColor, 0.5));
        ctx.fillStyle = bGrad;
        ctx.shadowColor = bColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-r * 1.6, 0);
        ctx.quadraticCurveTo(0, -r * 1.2, r * 1.6, 0);
        ctx.quadraticCurveTo(0, r * 0.5, -r * 1.6, 0);
        ctx.fill();

        // Rim highlight
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = Math.max(1, r * 0.25);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 1.4, -r * 0.08);
        ctx.quadraticCurveTo(0, -r * 1.0, r * 1.4, -r * 0.08);
        ctx.stroke();

        ctx.restore();

      } else {
        // ── Default projectile (glowing orb) ───────────────────────────────
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        const g = ctx.createRadialGradient(sx - p.radius * 0.3, sy - p.radius * 0.3, 0, sx, sy, p.radius);
        g.addColorStop(0, this._lightenColor(p.color, 0.6));
        g.addColorStop(1, p.color);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawEnemyProjectiles(projectiles, camera) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const color = p.color || '#ff66aa';

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      const g = ctx.createRadialGradient(sx - p.radius * 0.3, sy - p.radius * 0.3, 0, sx, sy, p.radius);
      g.addColorStop(0, this._lightenColor(color, 0.55));
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
      // White ring for enemy projectile readability
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPickups(pickups, camera, elapsed = 0) {
    for (const p of pickups) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      const pulse = Math.sin(elapsed * 5 + p.x * 0.2) * 1.2;
      const r = p.radius + pulse;

      if (p.type === 'hp') {
        if (p.hpValue >= 40) {
          this._drawPotionSprite(sx, sy, r);
        } else {
          this._drawHeartSprite(sx, sy, r, false);
        }
      } else {
        this._drawGemSprite(sx, sy, r);
      }
    }
  }

  drawOrbitWeapons(weapons, camera, elapsed = 0) {
    const ctx = this.ctx;
    const t = this.menuTime;

    for (const weapon of weapons) {
      // ── Magic orb (orbit) ───────────────────────────────────────────────
      if (weapon.type === 'orbit' && weapon.orbs) {
        for (const orb of weapon.orbs) {
          const sx = orb.x - camera.x;
          const sy = orb.y - camera.y;
          const r = orb.radius;
          ctx.save();
          // Inner glow core
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 18;
          const g = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 0, sx, sy, r);
          g.addColorStop(0, this._lightenColor(orb.color, 0.7));
          g.addColorStop(0.5, orb.color);
          g.addColorStop(1, this._darkenColor(orb.color, 0.4));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          // Sparkle ring
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(sx, sy, r * 1.4, 0, Math.PI * 2); ctx.stroke();
          // Rotating inner star
          ctx.translate(sx, sy);
          ctx.rotate(t * 3);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1;
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45);
            ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ── Chain lightning ─────────────────────────────────────────────────
      if (weapon.type === 'chain' && weapon.chainTargets && weapon.chainTimer > 0) {
        const fade = weapon.chainTimer / weapon.config.duration;
        ctx.save();
        // Draw multiple jittered bolt layers for crackling effect
        for (let layer = 0; layer < 3; layer++) {
          ctx.globalAlpha = fade * (0.9 - layer * 0.25);
          ctx.strokeStyle = layer === 0 ? '#ffffff' : weapon.color;
          ctx.lineWidth = layer === 0 ? 1.5 : 3 - layer;
          ctx.shadowColor = weapon.color;
          ctx.shadowBlur = layer === 0 ? 0 : 12;
          ctx.beginPath();
          for (let i = 0; i < weapon.chainTargets.length; i++) {
            const tgt = weapon.chainTargets[i];
            const sx = tgt.x - camera.x;
            const sy = tgt.y - camera.y;
            if (i === 0) {
              ctx.moveTo(sx, sy);
            } else {
              // Jitter midpoints for lightning zig-zag
              const prev = weapon.chainTargets[i - 1];
              const px = prev.x - camera.x, py = prev.y - camera.y;
              const jx = (px + sx) / 2 + (Math.random() - 0.5) * 20;
              const jy = (py + sy) / 2 + (Math.random() - 0.5) * 20;
              ctx.quadraticCurveTo(jx, jy, sx, sy);
            }
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── Area effects (fire circle / holy sword) ─────────────────────────
      if (weapon.areas) {
        for (const area of weapon.areas) {
          const sx = area.x - camera.x;
          const sy = area.y - camera.y;
          const r = area.radius;
          const fade = Math.min(1, area.timer / area.duration * 2);

          const wid = weapon.id || '';
          const isHoly = wid.includes('holy_sword');
          const isFire = wid.includes('fire_circle');

          if (isHoly) {
            this._drawHolySwordEffect(sx, sy, r, fade, t);
          } else if (isFire) {
            this._drawFireCircleEffect(sx, sy, r, fade, t);
          } else {
            // Generic area
            ctx.save();
            ctx.globalAlpha = fade * 0.3;
            ctx.fillStyle = area.color;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }
      }
    }
  }

  // ── Poison smoke — volumetric billowing cloud ───────────────────────────
  _drawPoisonSmoke(ctx, cx, cy, r, intensity, t) {
    ctx.save();

    // 10 overlapping smoke puffs, staggered in lifecycle phase
    // Each puff: born near enemy body, drifts up & outward, expands & fades
    const puffCount = 10;
    for (let i = 0; i < puffCount; i++) {
      // Stagger start phases so puffs are always at different lifecycle stages
      const phase = (t * (0.28 + (i % 5) * 0.04) + i / puffCount) % 1;

      // Birth position: slightly randomised around enemy centre
      const birthAngle = i * 2.39996; // golden angle → good spread
      const birthR = r * 0.45 * ((i % 3) / 3);
      const startX = cx + Math.cos(birthAngle) * birthR;
      const startY = cy - r * 0.2 + Math.sin(birthAngle) * birthR * 0.5;

      // As phase advances: drift upward, sway sideways, expand
      const rise   = phase * r * 2.8;
      const sway   = Math.sin(t * 1.4 + i * 1.7) * r * 0.38 * phase;
      const puffX  = startX + sway;
      const puffY  = startY - rise;

      // Puff radius grows as it rises (billowing effect)
      const puffR  = r * (0.32 + phase * 0.85);

      // Alpha: fade in quickly, linger, then fade out near end
      const alphaCurve = phase < 0.15
        ? phase / 0.15                      // ramp in
        : phase > 0.65
        ? 1 - (phase - 0.65) / 0.35        // ramp out
        : 1;
      const alpha = intensity * alphaCurve * 0.42;
      if (alpha < 0.015) continue;

      // Colour: dark toxic green-grey with a hint of yellow
      // Older puffs (higher phase) become more grey and transparent
      const greenness = Math.round(140 + (1 - phase) * 50);
      const redness   = Math.round(20  + (1 - phase) * 30);

      const g = ctx.createRadialGradient(
        puffX - puffR * 0.22, puffY - puffR * 0.18, 0,
        puffX, puffY, puffR
      );
      g.addColorStop(0,   `rgba(${redness},${greenness},${redness * 0.3 | 0},${alpha * 1.1})`);
      g.addColorStop(0.45,`rgba(${redness - 8},${greenness - 30},${redness * 0.2 | 0},${alpha * 0.75})`);
      g.addColorStop(1,   `rgba(10,40,5,0)`);

      ctx.fillStyle = g;
      ctx.shadowColor = `rgb(30,${greenness - 40},10)`;
      ctx.shadowBlur = puffR * 0.35;
      ctx.beginPath(); ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2); ctx.fill();
    }

    // Wispy tendrils — thin curling strands rising from the smoke
    ctx.shadowBlur = 0;
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.32 + i * 0.21) % 1;
      const alpha = intensity * (1 - phase) * 0.22;
      if (alpha < 0.02) continue;
      const wx = cx + Math.sin(i * 1.9 + t * 0.7) * r * 0.55;
      const wy = cy - r * 0.3 - phase * r * 2.2;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgba(60,180,30,1)`;
      ctx.lineWidth = Math.max(1, r * 0.08 * (1 - phase));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wx, wy + r * 0.3);
      ctx.bezierCurveTo(
        wx + Math.sin(t + i) * r * 0.2, wy,
        wx - Math.sin(t * 1.3 + i) * r * 0.25, wy - r * 0.35,
        wx + Math.sin(t * 0.8 + i * 2) * r * 0.15, wy - r * 0.6
      );
      ctx.stroke();
    }

    // Subtle green body tint on the enemy itself
    ctx.globalAlpha = intensity * 0.18;
    ctx.fillStyle = '#33cc22';
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.fill();

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Fire circle — full procedural flame simulation ──────────────────────
  _drawFireCircleEffect(sx, sy, r, fade, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);

    // Ground scorch — dark charred ellipse
    const scorch = ctx.createRadialGradient(0, r * 0.05, 0, 0, r * 0.05, r);
    scorch.addColorStop(0,   `rgba(15,4,0,${fade * 0.92})`);
    scorch.addColorStop(0.55,`rgba(8,2,0,${fade * 0.6})`);
    scorch.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = scorch;
    ctx.beginPath(); ctx.ellipse(0, r * 0.05, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();

    // Hot ember bed — white-yellow glowing base
    const bed = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.85);
    bed.addColorStop(0,    `rgba(255,245,200,${fade * 0.75})`);
    bed.addColorStop(0.25, `rgba(255,180,30,${fade * 0.55})`);
    bed.addColorStop(0.6,  `rgba(255,60,0,${fade * 0.3})`);
    bed.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 28;
    ctx.fillStyle = bed;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // ── Individual flame tongues filling the area ──
    // Two passes: large base flames, then smaller flickering tips
    const passes = [
      { count: 22, hMin: 0.65, hMax: 1.15, wBase: 0.18, speedMul: 1.0, bright: 0.9 },
      { count: 14, hMin: 0.35, hMax: 0.65, wBase: 0.10, speedMul: 1.6, bright: 1.0 },
    ];

    for (const pass of passes) {
      for (let i = 0; i < pass.count; i++) {
        // Distribute flame bases across the circle area using golden angle
        const angle = i * 2.39996; // golden angle spread
        const dist  = r * Math.sqrt((i + 0.5) / pass.count); // uniform area distribution
        const bx    = Math.cos(angle) * dist;
        const groundY = Math.sin(angle) * dist * 0.32; // perspective flatten

        // Per-flame flicker frequencies (all different to avoid sync)
        const freq1 = 3.7 + (i % 5) * 0.53;
        const freq2 = 5.1 + (i % 7) * 0.39;
        const phase = i * 0.97;

        // Height flicker
        const hFrac = pass.hMin + (pass.hMax - pass.hMin) *
          (0.5 + Math.sin(t * freq1 + phase) * 0.3 + Math.sin(t * freq2 * 0.6 + phase * 1.4) * 0.2);
        const h = r * hFrac;

        // Lean (wind-like drift)
        const lean = Math.sin(t * 2.1 + phase * 1.3) * r * 0.15
                   + Math.sin(t * 0.7 + phase) * r * 0.08;

        // Base width
        const bw = r * (pass.wBase + Math.sin(phase * 2.1) * 0.04);

        // Color: hotter = whiter core
        const coreAlpha = fade * pass.bright * (0.85 + Math.sin(t * freq1 + phase) * 0.15);
        const fg = ctx.createLinearGradient(bx, groundY, bx + lean, groundY - h);
        fg.addColorStop(0,    `rgba(255,250,180,${coreAlpha})`);
        fg.addColorStop(0.15, `rgba(255,200,40,${coreAlpha * 0.95})`);
        fg.addColorStop(0.4,  `rgba(255,90,5,${coreAlpha * 0.8})`);
        fg.addColorStop(0.72, `rgba(200,20,0,${coreAlpha * 0.45})`);
        fg.addColorStop(1,    'rgba(80,0,0,0)');
        ctx.fillStyle = fg;
        ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 10;

        // Flame shape: wide bezier base tapering to point
        ctx.beginPath();
        ctx.moveTo(bx - bw, groundY);
        ctx.bezierCurveTo(
          bx - bw * 0.5 + lean * 0.2, groundY - h * 0.35,
          bx + lean * 0.6,             groundY - h * 0.75,
          bx + lean,                   groundY - h
        );
        ctx.bezierCurveTo(
          bx + lean + bw * 0.15,       groundY - h * 0.75,
          bx + bw * 0.5 + lean * 0.2,  groundY - h * 0.35,
          bx + bw,                     groundY
        );
        ctx.fill();
      }
    }

    // Floating embers — small sparks that drift upward and fade
    ctx.shadowBlur = 0;
    for (let i = 0; i < 18; i++) {
      // Phase drives lifecycle: 0=just born, 1=gone
      const speed = 0.55 + (i % 5) * 0.08;
      const phase = (t * speed + i * 0.318) % 1;
      const angle = i * 2.39996 + t * 0.4;
      const startR = r * ((i % 9) / 9 * 0.75);
      const ex = Math.cos(angle) * startR + Math.sin(t * 2.1 + i) * r * 0.08;
      const ey = Math.sin(angle) * startR * 0.3 - phase * r * 1.8;
      const er = (1.8 - phase * 1.4) * (1 + (i % 3) * 0.5);

      if (er < 0.4 || phase > 0.88) continue;
      const emberAlpha = fade * (1 - phase) * 0.9;
      ctx.globalAlpha = emberAlpha;
      ctx.fillStyle = phase < 0.4 ? '#ffffc0' : phase < 0.7 ? '#ffaa22' : '#ff4400';
      ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
    }

    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Holy sword animated effect ──────────────────────────────────────────
  _drawHolySwordEffect(sx, sy, r, fade, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);

    // Divine beam from above (tall glowing column)
    const beamH = r * 4.5;
    const beamW = r * 0.55;
    const beamG = ctx.createLinearGradient(0, -beamH, 0, r * 0.5);
    beamG.addColorStop(0, 'rgba(255,255,200,0)');
    beamG.addColorStop(0.4, `rgba(255,255,180,${fade * 0.35})`);
    beamG.addColorStop(0.85, `rgba(255,255,100,${fade * 0.65})`);
    beamG.addColorStop(1, `rgba(255,255,60,0)`);
    ctx.fillStyle = beamG;
    ctx.shadowColor = '#ffffa0';
    ctx.shadowBlur = 24;
    ctx.fillRect(-beamW / 2, -beamH, beamW, beamH + r * 0.5);

    // Impact circle on ground
    const impactG = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    impactG.addColorStop(0, `rgba(255,255,200,${fade * 0.7})`);
    impactG.addColorStop(0.5, `rgba(255,220,80,${fade * 0.4})`);
    impactG.addColorStop(1, 'rgba(255,200,40,0)');
    ctx.fillStyle = impactG;
    ctx.shadowColor = '#ffee44';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // Sword silhouette (blade + guard + pommel) — falling from top
    const swordScale = r * 0.9;
    const sway = Math.sin(t * 3) * 0.06;
    ctx.rotate(sway);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 16;

    // Blade
    const bladeG = ctx.createLinearGradient(-swordScale * 0.1, -swordScale * 1.1, swordScale * 0.1, swordScale * 0.5);
    bladeG.addColorStop(0, '#ffffff');
    bladeG.addColorStop(0.4, '#ffffcc');
    bladeG.addColorStop(1, '#ffcc44');
    ctx.fillStyle = bladeG;
    ctx.beginPath();
    ctx.moveTo(0, -swordScale * 1.1);   // tip
    ctx.lineTo(swordScale * 0.1, -swordScale * 0.3);
    ctx.lineTo(swordScale * 0.07, swordScale * 0.45);
    ctx.lineTo(-swordScale * 0.07, swordScale * 0.45);
    ctx.lineTo(-swordScale * 0.1, -swordScale * 0.3);
    ctx.closePath(); ctx.fill();

    // Guard (crossguard)
    ctx.fillStyle = '#ffdd44';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, -swordScale * 0.22, swordScale * 0.42, swordScale * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pommel
    ctx.beginPath();
    ctx.arc(0, swordScale * 0.52, swordScale * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Divine sparkles around blade
    ctx.shadowBlur = 0;
    for (let k = 0; k < 5; k++) {
      const sa = t * 4 + (k / 5) * Math.PI * 2;
      const dist = swordScale * (0.4 + Math.sin(t * 3 + k) * 0.2);
      const sx2 = Math.cos(sa) * dist * 0.5;
      const sy2 = Math.sin(sa) * dist - swordScale * 0.3;
      ctx.globalAlpha = fade * (0.5 + Math.sin(t * 5 + k * 1.3) * 0.4);
      ctx.fillStyle = '#ffffff';
      // 4-point star sparkle
      ctx.beginPath();
      ctx.moveTo(sx2, sy2 - 4);
      ctx.lineTo(sx2 + 1, sy2 - 1);
      ctx.lineTo(sx2 + 4, sy2);
      ctx.lineTo(sx2 + 1, sy2 + 1);
      ctx.lineTo(sx2, sy2 + 4);
      ctx.lineTo(sx2 - 1, sy2 + 1);
      ctx.lineTo(sx2 - 4, sy2);
      ctx.lineTo(sx2 - 1, sy2 - 1);
      ctx.closePath(); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawHUD(player, elapsed, runGold, skillLevels) {
    const ctx = this.ctx;
    const ui = CONFIG.ui;

    const hpBarX = (this.canvas.width - ui.hpBarWidth) / 2;
    const hpBarY = 15;
    const hpPercent = Math.max(0, player.hp / player.maxHp);

    // HP bar — rounded background
    ctx.save();
    this._roundRect(hpBarX, hpBarY, ui.hpBarWidth, ui.hpBarHeight, 5);
    ctx.fillStyle = '#1a1a2a';
    ctx.fill();
    ctx.restore();

    // HP bar — gradient fill with low-HP red glow
    if (hpPercent > 0) {
      ctx.save();
      const hpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + ui.hpBarWidth, 0);
      if (hpPercent > 0.5) {
        hpGrad.addColorStop(0, '#1e8822');
        hpGrad.addColorStop(1, '#44ee55');
      } else if (hpPercent > 0.25) {
        hpGrad.addColorStop(0, '#996600');
        hpGrad.addColorStop(1, '#ffdd22');
      } else {
        hpGrad.addColorStop(0, '#881111');
        hpGrad.addColorStop(1, '#ff4444');
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 10 + Math.sin(this.menuTime * 5) * 4;
      }
      this._roundRect(hpBarX, hpBarY, ui.hpBarWidth * hpPercent, ui.hpBarHeight, 5);
      ctx.fillStyle = hpGrad;
      ctx.fill();
      ctx.restore();
    }

    // HP bar border
    ctx.save();
    this._roundRect(hpBarX, hpBarY, ui.hpBarWidth, ui.hpBarHeight, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, this.canvas.width / 2, hpBarY + ui.hpBarHeight - 3);

    // EXP bar — rounded with soft glow
    const expBarY = hpBarY + ui.hpBarHeight + 3;
    ctx.save();
    this._roundRect(hpBarX, expBarY, ui.hpBarWidth, ui.expBarHeight, 3);
    ctx.fillStyle = '#111122';
    ctx.fill();
    const expPercent = player.exp / player.expToNextLevel();
    if (expPercent > 0) {
      this._roundRect(hpBarX, expBarY, ui.hpBarWidth * Math.min(1, expPercent), ui.expBarHeight, 3);
      ctx.fillStyle = '#5577ff';
      ctx.shadowColor = '#4466ff';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();

    // Level badge (top-left)
    ctx.save();
    this._roundRect(6, 10, 46, 22, 5);
    ctx.fillStyle = 'rgba(30,30,70,0.75)';
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ccddff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${player.level}`, 29, 25);

    // Timer (top-center, above HP bar)
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillStyle = '#aabbcc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, this.canvas.width / 2, 12);

    // Kill count & Gold (top-left, below level badge)
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ccccdd';
    ctx.fillText(`☠ ${player.kills}`, 10, 48);
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`✦ ${Math.floor(runGold || 0)}`, 10, 64);

    // Acquired skills — colored dot badges + level number
    if (skillLevels) {
      let bx = 10;
      let by = 82;
      const slotW = 28;
      const maxX = this.canvas.width / 2 - 10;
      for (const def of getSkillDefs()) {
        const lv = skillLevels[def.id] || 0;
        if (lv <= 0) continue;
        if (bx + slotW > maxX) { bx = 10; by += 20; }
        this._drawSkillIcon(bx + 7, by - 5, 7, def);
        ctx.fillStyle = '#ccddff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lv, bx + 16, by - 1);
        bx += slotW;
      }
    }

    // Pause button (top-right) — drawn II symbol, no emoji
    const pbX = this.canvas.width - 50;
    const pbY = 10;
    ctx.save();
    this._roundRect(pbX, pbY, 40, 40, 7);
    ctx.fillStyle = 'rgba(30,30,65,0.78)';
    ctx.fill();
    ctx.strokeStyle = '#5566aa';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // Two vertical bars
    ctx.fillStyle = '#aabbdd';
    ctx.fillRect(pbX + 13, pbY + 11, 5, 18);
    ctx.fillRect(pbX + 22, pbY + 11, 5, 18);
  }

  drawBossHPBar(boss) {
    if (!boss || !boss.alive) return;
    const ctx = this.ctx;
    const barWidth = this.canvas.width * 0.62;
    const barHeight = 15;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 56;

    // Background
    ctx.save();
    this._roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.fillStyle = '#1a0808';
    ctx.fill();
    ctx.restore();

    // HP fill — gradient + pulsing glow
    const hpPercent = Math.max(0, boss.hp / boss.maxHp);
    if (hpPercent > 0) {
      ctx.save();
      const bossGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      bossGrad.addColorStop(0, '#880000');
      bossGrad.addColorStop(0.5, '#ff2222');
      bossGrad.addColorStop(1, '#ff6644');
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 12 + Math.sin(this.menuTime * 3) * 5;
      this._roundRect(barX, barY, barWidth * hpPercent, barHeight, 5);
      ctx.fillStyle = bossGrad;
      ctx.fill();
      ctx.restore();
    }

    // Border
    ctx.save();
    this._roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.strokeStyle = 'rgba(255,80,80,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Boss name with skull drawn to the left
    const cx = this.canvas.width / 2;
    ctx.fillStyle = '#ff7777';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.typeDef.name, cx, barY - 5);

    // Small drawn skull icon (left of name)
    const nameW = ctx.measureText(boss.typeDef.name).width;
    const skX = cx - nameW / 2 - 14;
    const skY = barY - 11;
    ctx.save();
    ctx.translate(skX, skY);
    ctx.strokeStyle = '#ff7777';
    ctx.fillStyle = '#ff7777';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0808';
    ctx.beginPath(); ctx.arc(-2, -1.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -1.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawBossIndicator(boss, camera) {
    if (!boss || !boss.alive) return;
    const ctx = this.ctx;
    const sx = boss.x - camera.x;
    const sy = boss.y - camera.y;
    const margin = 40;

    // Only show indicator if boss is off-screen
    if (sx >= -margin && sx <= this.canvas.width + margin &&
        sy >= -margin && sy <= this.canvas.height + margin) return;

    // Calculate direction from screen center to boss
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);

    // Position arrow at screen edge
    const edgeX = Math.max(30, Math.min(this.canvas.width - 30, cx + Math.cos(angle) * (this.canvas.width / 2 - 40)));
    const edgeY = Math.max(80, Math.min(this.canvas.height - 30, cy + Math.sin(angle) * (this.canvas.height / 2 - 40)));

    // Draw arrow
    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(angle);
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();

    // Pulsing glow
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawBossEntrance(canvas, bossEntrance) {
    if (!bossEntrance) return;
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    const t = bossEntrance.timer;

    if (t > 0.6) {
      // Phase 1: WARNING text (no darkening, just text overlay)
      const pulse = Math.sin((1.2 - t) * 16) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff2222';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ WARNING ⚠', cx, canvas.height * 0.35);
      ctx.globalAlpha = 1;
    } else {
      // Phase 2: boss name fading out
      ctx.globalAlpha = t / 0.6;
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bossEntrance.bossName || 'BOSS', cx, canvas.height * 0.35);
      ctx.globalAlpha = 1;
    }
  }

  drawPauseOverlay(canvas) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0,0,8,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel card
    const panW = 240, panH = 200;
    ctx.save();
    this._roundRect(cx - panW / 2, cy - panH / 2, panW, panH, 14);
    ctx.fillStyle = 'rgba(16,16,44,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,120,220,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.fillStyle = '#ccd8ff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲暫停', cx, cy - 52);

    // Resume button
    const btnW = 170, btnH = 46;
    const resumeY = cy - 20;
    ctx.save();
    this._roundRect(cx - btnW / 2, resumeY, btnW, btnH, 9);
    ctx.fillStyle = '#1a3a1a';
    ctx.fill();
    ctx.shadowColor = '#44cc44';
    ctx.shadowBlur = 10;
    this._roundRect(cx - btnW / 2, resumeY, btnW, btnH, 9);
    ctx.strokeStyle = '#44cc44';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#55ee55';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('繼續遊戲', cx, resumeY + 30);

    // Exit button
    const exitY = cy + 44;
    ctx.save();
    this._roundRect(cx - btnW / 2, exitY, btnW, btnH, 9);
    ctx.fillStyle = '#3a1a1a';
    ctx.fill();
    ctx.shadowColor = '#cc4444';
    ctx.shadowBlur = 10;
    this._roundRect(cx - btnW / 2, exitY, btnW, btnH, 9);
    ctx.strokeStyle = '#cc4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ee5555';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('離開遊戲', cx, exitY + 30);
  }

  triggerShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  triggerDamageFlash() {
    this.damageFlashTimer = 0.1;
  }

  triggerLevelUpFlash() {
    this.levelUpFlashTimer = 0.15;
  }

  startTransition(direction, callback) {
    this.transition = {
      alpha: direction === 'out' ? 0 : 1,
      direction,
      speed: 1 / 0.3, // 0.3s duration
      callback,
    };
  }

  updateEffects(dt) {
    // Advance menu animation clock
    this.menuTime += dt;

    // Drift stars slowly downward
    for (const s of this.stars) {
      s.y += s.speed;
      if (s.y > 1) s.y = 0;
    }

    // Decay shake
    if (this.shakeIntensity > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeIntensity *= 0.85;
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }

    // Decay damage flash
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
    }

    // Decay level-up flash
    if (this.levelUpFlashTimer > 0) {
      this.levelUpFlashTimer -= dt;
    }

    // Screen transition
    if (this.transition) {
      const t = this.transition;
      if (t.direction === 'out') {
        t.alpha += t.speed * dt;
        if (t.alpha >= 1) {
          t.alpha = 1;
          if (t.callback) t.callback();
          this.transition = { alpha: 1, direction: 'in', speed: t.speed, callback: null };
        }
      } else {
        t.alpha -= t.speed * dt;
        if (t.alpha <= 0) {
          this.transition = null;
        }
      }
    }
  }

  applyShake(camera) {
    return {
      x: camera.x + this.shakeOffsetX,
      y: camera.y + this.shakeOffsetY,
    };
  }

  drawDamageFlash() {
    if (this.damageFlashTimer > 0) {
      const ctx = this.ctx;
      const alpha = Math.min(0.3, this.damageFlashTimer / 0.1 * 0.3);
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawLevelUpFlash() {
    if (this.levelUpFlashTimer > 0) {
      const ctx = this.ctx;
      const alpha = Math.min(0.2, this.levelUpFlashTimer / 0.15 * 0.2);
      ctx.fillStyle = `rgba(255, 221, 68, ${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawTransition() {
    if (this.transition) {
      const ctx = this.ctx;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, this.transition.alpha))})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawJoystick(input) {
    const data = input.getJoystickRenderData();
    if (!data) return;

    const ctx = this.ctx;

    // Base
    ctx.fillStyle = CONFIG.ui.joystickColor;
    ctx.beginPath();
    ctx.arc(data.baseX, data.baseY, data.radius, 0, Math.PI * 2);
    ctx.fill();

    // Knob
    ctx.fillStyle = CONFIG.ui.joystickKnobColor;
    ctx.beginPath();
    ctx.arc(data.knobX, data.knobY, CONFIG.ui.joystickKnobRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shared card-list renderer used by both level-up and room-clear panels
  _drawSkillCards(skillChoices, canvas, titleText) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = 'rgba(0,0,10,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title with glow
    ctx.save();
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, cx, canvas.height * 0.16);
    ctx.restore();

    const count = skillChoices.length;
    const gap = 12;
    const cardW = Math.min(148, (canvas.width - gap * (count + 1)) / count);
    const cardH = 130;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = cx - totalW / 2;
    const cardY = canvas.height * 0.23;

    for (let i = 0; i < count; i++) {
      const skill = skillChoices[i];
      const bx = startX + i * (cardW + gap);
      const cat = skill.pool || skill.category || 'passive';
      const accentColor = cat === 'archero' ? '#4488ff'
        : cat === 'survivor' ? '#44cc66'
        : cat === 'weapon' ? '#cc44ff'
        : '#7766aa';

      // Card shadow + bg
      ctx.save();
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;
      this._roundRect(bx, cardY, cardW, cardH, 10);
      ctx.fillStyle = '#1e1e3c';
      ctx.fill();
      // Accent border
      this._roundRect(bx, cardY, cardW, cardH, 10);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Skill icon — unique symbol per skill ID
      this._drawSkillIcon(bx + cardW / 2, cardY + 28, 18, skill);

      // Name
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(skill.name, bx + cardW / 2, cardY + 62);

      // Divider
      ctx.strokeStyle = `${accentColor}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 10, cardY + 70);
      ctx.lineTo(bx + cardW - 10, cardY + 70);
      ctx.stroke();

      // Description (auto-wrap at ~13 chars)
      ctx.font = '10px monospace';
      ctx.fillStyle = '#9999bb';
      const desc = skill.description;
      const wrap = 13;
      if (desc.length > wrap) {
        ctx.fillText(desc.substring(0, wrap), bx + cardW / 2, cardY + 86);
        ctx.fillText(desc.substring(wrap, wrap * 2), bx + cardW / 2, cardY + 100);
        if (desc.length > wrap * 2) ctx.fillText(desc.substring(wrap * 2), bx + cardW / 2, cardY + 114);
      } else {
        ctx.fillText(desc, bx + cardW / 2, cardY + 93);
      }
    }
  }

  drawLevelUpPanel(skillChoices, canvas) {
    this._drawSkillCards(skillChoices, canvas, '升級！選擇技能');
  }

  drawGameOver(player, elapsed, canvas, runGold) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawStarfield(canvas);

    // Panel card
    const panW = Math.min(300, canvas.width - 40);
    const panH = 240;
    ctx.save();
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 30;
    this._roundRect(cx - panW / 2, cy - panH / 2, panW, panH, 14);
    ctx.fillStyle = 'rgba(22,6,6,0.92)';
    ctx.fill();
    this._roundRect(cx - panW / 2, cy - panH / 2, panW, panH, 14);
    ctx.strokeStyle = 'rgba(200,40,40,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.save();
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束', cx, cy - 80);
    ctx.restore();

    // Stats
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillStyle = '#ccccdd';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`存活時間  ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cx, cy - 36);
    ctx.fillText(`擊殺數    ${player.kills}`, cx, cy - 10);
    ctx.fillText(`等級      ${player.level}`, cx, cy + 16);
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`獲得金幣  ${Math.floor(runGold || 0)}`, cx, cy + 44);

    // Prompt button
    ctx.save();
    this._roundRect(cx - 90, cy + 68, 180, 42, 9);
    ctx.fillStyle = '#2a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#cc4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ee6666';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('點擊重新開始', cx, cy + 93);
  }

  drawVictory(player, elapsed, canvas, runGold) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawStarfield(canvas);

    // Animated radial burst from center
    ctx.save();
    const burst = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
    burst.addColorStop(0, `rgba(255,220,60,${0.12 + Math.sin(this.menuTime * 2) * 0.06})`);
    burst.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = burst;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Panel card
    const panW = Math.min(300, canvas.width - 40);
    const panH = 260;
    ctx.save();
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 30 + Math.sin(this.menuTime * 2) * 8;
    this._roundRect(cx - panW / 2, cy - panH / 2, panW, panH, 14);
    ctx.fillStyle = 'rgba(20,18,4,0.92)';
    ctx.fill();
    this._roundRect(cx - panW / 2, cy - panH / 2, panW, panH, 14);
    ctx.strokeStyle = 'rgba(220,200,40,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.save();
    const tg = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0);
    tg.addColorStop(0, '#ffaa00');
    tg.addColorStop(0.5, '#ffee44');
    tg.addColorStop(1, '#ffaa00');
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 20;
    ctx.fillStyle = tg;
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('勝利！', cx, cy - 88);
    ctx.restore();

    ctx.fillStyle = '#55ee88';
    ctx.font = '17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜通關！', cx, cy - 58);

    // Stats
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillStyle = '#ccccdd';
    ctx.font = '16px monospace';
    ctx.fillText(`通關時間  ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cx, cy - 18);
    ctx.fillText(`擊殺數    ${player.kills}`, cx, cy + 8);
    ctx.fillText(`等級      ${player.level}`, cx, cy + 34);
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`獲得金幣  ${Math.floor(runGold || 0)} (2x)`, cx, cy + 62);

    // Prompt button
    ctx.save();
    this._roundRect(cx - 100, cy + 86, 200, 42, 9);
    ctx.fillStyle = '#1e1a00';
    ctx.fill();
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffee55';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('點擊返回主選單', cx, cy + 111);
  }

  drawMenu(canvas, meta) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;
    // Anchor content at 38% of screen height so it sits in the upper portion
    // rather than dead-center, which leaves too much empty space on tall phones.
    const anchorY = Math.round(canvas.height * 0.38);

    // Background
    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated starfield
    this.drawStarfield(canvas);

    // Subtle radial vignette from center-top for depth
    const vign = ctx.createRadialGradient(cx, 0, 0, cx, canvas.height * 0.5, canvas.height * 0.85);
    vign.addColorStop(0, 'rgba(0,100,180,0.12)');
    vign.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title — gradient text with glow
    ctx.save();
    const titleGrad = ctx.createLinearGradient(cx - 160, 0, cx + 160, 0);
    titleGrad.addColorStop(0, '#00aaff');
    titleGrad.addColorStop(0.45, '#00ffee');
    titleGrad.addColorStop(1, '#aa66ff');
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 24 + Math.sin(this.menuTime * 2) * 6;
    ctx.fillStyle = titleGrad;
    ctx.fillText('CrazyGaGa', cx, anchorY - 60);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#8899bb';
    ctx.font = '15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Dungeon Archer · Horde Survival', cx, anchorY - 24);

    // Selected character & gold
    if (meta) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '14px monospace';
      ctx.fillText(`金幣: ${meta.gold}`, cx, anchorY + 15);
      const charDef = getCharacterDefs().find(c => c.id === meta.selected);
      if (charDef) {
        ctx.fillStyle = charDef.color;
        ctx.fillText(`角色: ${charDef.name}`, cx, anchorY + 35);
      }
    }

    // Controls hint
    ctx.fillStyle = '#555577';
    ctx.font = '13px monospace';
    ctx.fillText('WASD / 虛擬搖桿 移動', cx, anchorY + 100);

    // Row of 3 utility buttons: 商店, 角色, 設定
    const btnW = 90;
    const btnH = 40;
    const gap = 15;
    const totalW = btnW * 3 + gap * 2;
    const startX = cx - totalW / 2;
    const btnY = anchorY + 140;
    const labels = ['商店', '角色', '設定'];

    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (btnW + gap);
      ctx.save();
      this._roundRect(bx, btnY, btnW, btnH, 7);
      ctx.fillStyle = '#252550';
      ctx.fill();
      ctx.strokeStyle = '#5566aa';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#aabbdd';
      ctx.font = '15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], bx + btnW / 2, btnY + 26);
    }

    // Mode buttons — larger, with glow borders
    const modeBtnW = 160;
    const modeBtnH = 52;
    const modeGap = 20;
    const modeTotalW = modeBtnW * 2 + modeGap;
    const modeStartX = cx - modeTotalW / 2;
    const modeBtnY = anchorY + 200;

    const modeButtons = [
      { label: '🏹 地城模式', fill: '#06213f', border: '#00aaff', glow: '#00aaff' },
      { label: '⚔️ 生存模式', fill: '#2e1800', border: '#ffaa00', glow: '#ffaa00' },
    ];
    for (let i = 0; i < 2; i++) {
      const bx = modeStartX + i * (modeBtnW + modeGap);
      // Fill
      ctx.save();
      this._roundRect(bx, modeBtnY, modeBtnW, modeBtnH, 10);
      ctx.fillStyle = modeButtons[i].fill;
      ctx.fill();
      // Glowing border
      ctx.shadowColor = modeButtons[i].glow;
      ctx.shadowBlur = 14 + Math.sin(this.menuTime * 2.5 + i * Math.PI) * 4;
      this._roundRect(bx, modeBtnY, modeBtnW, modeBtnH, 10);
      ctx.strokeStyle = modeButtons[i].border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(modeButtons[i].label, bx + modeBtnW / 2, modeBtnY + 33);
    }

    // Version — bottom-left
    ctx.fillStyle = '#444466';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`v${VERSION}`, 12, canvas.height - 10);
  }

  drawChapterSelect(canvas, meta, chapters) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawStarfield(canvas);

    // Back button
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('← 返回', 15, 32);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('選擇章節', cx, canvas.height * 0.18);

    // Chapter info — drawn icons instead of emoji
    const chapterMeta = [
      { drawIcon: (x, y) => { // Forest: three triangles (trees)
          ctx.fillStyle = '#55cc66';
          for (let t = -1; t <= 1; t++) {
            ctx.beginPath();
            ctx.moveTo(x + t*9, y - 11);
            ctx.lineTo(x + t*9 - 7, y + 4);
            ctx.lineTo(x + t*9 + 7, y + 4);
            ctx.closePath(); ctx.fill();
          }
        }, difficulty: '★', diffLabel: 'Normal', color: '#44aa66' },
      { drawIcon: (x, y) => { // Volcano: triangle with peak
          ctx.fillStyle = '#cc5522';
          ctx.beginPath();
          ctx.moveTo(x, y - 12); ctx.lineTo(x + 13, y + 6); ctx.lineTo(x - 13, y + 6);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.moveTo(x, y - 12); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x - 5, y - 4);
          ctx.closePath(); ctx.fill();
        }, difficulty: '★★', diffLabel: 'Hard', color: '#dd8833' },
      { drawIcon: (x, y) => { // Snowflake: 6 spokes
          ctx.strokeStyle = '#88ccff';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
            ctx.stroke();
          }
          ctx.fillStyle = '#88ccff';
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        }, difficulty: '★★★', diffLabel: 'Expert', color: '#4488dd' },
    ];

    const cardW = Math.min(320, canvas.width - 40);
    const cardH = 90;
    const cardGap = 16;
    const cardX = cx - cardW / 2;
    const startY = canvas.height * 0.28;

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const cm = chapterMeta[i] || { drawIcon: () => {}, difficulty: '?', diffLabel: '', color: '#666' };
      const cardY = startY + i * (cardH + cardGap);
      const unlocked = meta && (i === 0 || (meta.clearedChapters || []).includes(i - 1));
      const cleared = meta && (meta.clearedChapters || []).includes(i);

      // Card rounded background
      ctx.save();
      if (unlocked) {
        ctx.shadowColor = cm.color;
        ctx.shadowBlur = 8;
      }
      this._roundRect(cardX, cardY, cardW, cardH, 10);
      ctx.fillStyle = unlocked ? '#181838' : '#0e0e20';
      ctx.fill();
      this._roundRect(cardX, cardY, cardW, cardH, 10);
      ctx.strokeStyle = unlocked ? cm.color : '#2a2a44';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (!unlocked) {
        // Locked padlock (drawn)
        const lx = cx, ly = cardY + 40;
        ctx.strokeStyle = '#555577'; ctx.fillStyle = '#555577';
        ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(lx, ly - 8, 8, Math.PI, 0); ctx.stroke();
        this._roundRect(lx - 10, ly - 4, 20, 16, 3);
        ctx.fill();
        ctx.fillStyle = '#333355';
        ctx.beginPath(); ctx.arc(lx, ly + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#555577';
        ctx.fillText('通關前一章節以解鎖', cx, cardY + cardH - 10);
      } else {
        // Chapter drawn icon
        cm.drawIcon(cardX + 28, cardY + 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`第${ch.id}章  ${ch.name}`, cardX + 54, cardY + 32);

        ctx.fillStyle = cm.color;
        ctx.font = '13px monospace';
        ctx.fillText(`${cm.difficulty} ${cm.diffLabel}`, cardX + 54, cardY + 52);

        // Cleared check or pending
        ctx.textAlign = 'right';
        if (cleared) {
          ctx.fillStyle = '#44ee44';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('通關', cardX + cardW - 12, cardY + 32);
          // Draw small checkmark
          const ckx = cardX + cardW - 30, cky = cardY + 26;
          ctx.strokeStyle = '#44ee44'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ckx, cky); ctx.lineTo(ckx + 5, cky + 6); ctx.lineTo(ckx + 12, cky - 6);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#8888aa';
          ctx.font = '12px monospace';
          ctx.fillText('未通關', cardX + cardW - 12, cardY + 32);
        }

        ctx.fillStyle = '#666688';
        ctx.font = '11px monospace';
        ctx.fillText(`${ch.rooms.length} 房間`, cardX + cardW - 12, cardY + 52);

        ctx.fillStyle = '#7788aa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('點擊開始', cx, cardY + cardH - 10);
      }
    }

    ctx.textAlign = 'left'; // reset
  }

  drawShopPage(canvas, meta) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Back button
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('← 返回', 15, 32);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('商店', cx, 60);

    // Gold display
    ctx.fillStyle = '#ffdd44';
    ctx.font = '16px monospace';
    ctx.fillText(`金幣: ${meta.gold}`, cx, 82);

    // Upgrade rows
    const rowH = 60;
    const startY = 100;
    const btnW = 60;
    const btnH = 30;
    const btnX = cx + 80;

    const upgradeDefs = getUpgradeDefs();
    for (let i = 0; i < upgradeDefs.length; i++) {
      const def = upgradeDefs[i];
      const level = meta.upgrades[def.id] || 0;
      const y = startY + i * rowH;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? null : def.costs[level];
      const canAfford = !maxed && meta.gold >= cost;

      // Name
      ctx.fillStyle = '#ccccee';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, cx - 160, y + 18);

      // Description
      ctx.fillStyle = '#8888aa';
      ctx.font = '11px monospace';
      ctx.fillText(def.description, cx - 160, y + 35);

      // Level
      ctx.fillStyle = '#aaaacc';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${level}/${def.maxLevel}`, cx + 40, y + 25);

      // Buy button
      const by = y + 15;
      if (maxed) {
        ctx.fillStyle = '#333355';
        ctx.fillRect(btnX, by, btnW, btnH);
        ctx.fillStyle = '#666688';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MAX', btnX + btnW / 2, by + 20);
      } else {
        ctx.fillStyle = canAfford ? '#2a4e2a' : '#4e2a2a';
        ctx.fillRect(btnX, by, btnW, btnH);
        ctx.strokeStyle = canAfford ? '#44aa44' : '#aa4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, by, btnW, btnH);
        ctx.fillStyle = canAfford ? '#44dd44' : '#dd4444';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${cost}g`, btnX + btnW / 2, by + 20);
      }
    }
  }

  drawCharacterSelect(canvas, meta) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawStarfield(canvas);

    // Back button
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('← 返回', 15, 32);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('選擇角色', cx, 60);

    // Gold display
    ctx.fillStyle = '#ffdd44';
    ctx.font = '16px monospace';
    ctx.fillText(`金幣: ${meta.gold}`, cx, 82);

    // Character cards
    const cardH = 100;
    const gap = 15;
    const startY = 100;
    const cardW = Math.min(320, canvas.width - 40);
    const cardX = cx - cardW / 2;

    const charDefs = getCharacterDefs();
    for (let i = 0; i < charDefs.length; i++) {
      const def = charDefs[i];
      const y = startY + i * (cardH + gap);
      const unlocked = meta.unlocked.includes(def.id);
      const selected = meta.selected === def.id;
      const borderColor = selected ? '#6688ff' : (unlocked ? '#4455bb' : '#2a2a44');

      // Rounded card background
      ctx.save();
      if (selected) { ctx.shadowColor = '#6688ff'; ctx.shadowBlur = 12; }
      this._roundRect(cardX, y, cardW, cardH, 10);
      ctx.fillStyle = selected ? '#1e1e50' : '#161628';
      ctx.fill();
      this._roundRect(cardX, y, cardW, cardH, 10);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();

      // Sphere dot in character color
      this._drawSphere(cardX + 26, y + 38, 12, def.color);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, cardX + 48, y + 32);

      // Description
      ctx.fillStyle = '#8899bb';
      ctx.font = '12px monospace';
      ctx.fillText(def.description, cardX + 48, y + 52);

      // Stats
      ctx.fillStyle = '#667799';
      ctx.font = '11px monospace';
      ctx.fillText(`HP ${def.baseStats.maxHp}  SPD ${def.baseStats.speed}`, cardX + 48, y + 70);

      // Status (right side)
      ctx.textAlign = 'right';
      if (!unlocked) {
        // Lock icon (drawn) + cost
        const lx = cardX + cardW - 55, ly = y + 35;
        ctx.strokeStyle = '#ff7777'; ctx.fillStyle = '#ff7777';
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(lx, ly - 6, 5, Math.PI, 0); ctx.stroke();
        this._roundRect(lx - 6, ly - 2, 12, 10, 2); ctx.fill();
        ctx.fillStyle = '#ff7777';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${def.unlockCost}g`, cardX + cardW - 12, y + 40);
      } else if (selected) {
        // Drawn checkmark
        const ckx = cardX + cardW - 52, cky = y + 32;
        ctx.strokeStyle = '#55ee55'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ckx, cky); ctx.lineTo(ckx + 6, cky + 8); ctx.lineTo(ckx + 16, cky - 6);
        ctx.stroke();
        ctx.fillStyle = '#55ee55';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('使用中', cardX + cardW - 12, y + 40);
      } else {
        ctx.fillStyle = '#8899bb';
        ctx.font = '13px monospace';
        ctx.fillText('點擊選擇', cardX + cardW - 12, y + 40);
      }
    }
  }

  drawConfigEditor(canvas, editorState) {
    const ctx = this.ctx;
    const W = canvas.width;
    const H = canvas.height;
    const TAB_BAR_H = 42;
    const BOTTOM_H = 50;
    const ROW_H = 38;
    const LABEL_COL = 0.55;

    // Background
    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, W, H);

    // ── Tab bar (7 tabs) ──
    const TABS = ['settings', 'global', 'enemies', 'weapons', 'passives', 'characters', 'upgrades'];
    const TAB_LABELS = { settings:'調整', global:'全域', enemies:'敵人', weapons:'武器', passives:'技能', characters:'角色', upgrades:'升級' };
    const tabW = W / TABS.length;
    for (let i = 0; i < TABS.length; i++) {
      const tx = i * tabW;
      const active = editorState.activeTab === TABS[i];
      ctx.fillStyle = active ? '#2a2a6e' : '#1a1a3e';
      ctx.fillRect(tx, 0, tabW, TAB_BAR_H);
      ctx.strokeStyle = active ? '#6688ff' : '#333366';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, 0, tabW, TAB_BAR_H);
      ctx.fillStyle = active ? '#ffffff' : '#7777aa';
      ctx.font = `${active ? 'bold ' : ''}12px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(TAB_LABELS[TABS[i]], tx + tabW / 2, TAB_BAR_H / 2 + 5);
    }

    const listTop = TAB_BAR_H;
    const listH = H - TAB_BAR_H - BOTTOM_H;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listTop, W, listH);
    ctx.clip();

    if (editorState.activeTab === 'settings') {
      // ── Settings tab: slider controls ──
      const sliderW = Math.min(260, W * 0.65);
      const sliderX = W / 2 - sliderW / 2;
      const scrollY = editorState.scrollY;

      for (let i = 0; i < SETTINGS_DEFS.length; i++) {
        const def = SETTINGS_DEFS[i];
        const rowY = SETTINGS_CONTENT_Y + i * SETTINGS_ROW_H - scrollY;
        const sliderY = rowY + 30;
        if (sliderY + 10 < listTop || rowY > listTop + listH) continue;

        const value = editorState.settingsValues[def.key] ?? def.default;
        const isModified = value !== def.default;

        // Label
        ctx.fillStyle = isModified ? '#ffdd44' : '#ccccee';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(def.label, sliderX, rowY + 15);

        // Value
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffdd44';
        const displayVal = def.step < 1 ? value.toFixed(2) : Math.round(value);
        ctx.fillText(String(displayVal), sliderX + sliderW, rowY + 15);

        // Track
        ctx.fillStyle = '#333355';
        ctx.fillRect(sliderX, sliderY - 4, sliderW, 8);

        // Fill
        const ratio = (value - def.min) / (def.max - def.min);
        ctx.fillStyle = isModified ? '#7744aa' : '#4466aa';
        ctx.fillRect(sliderX, sliderY - 4, sliderW * ratio, 8);

        // Knob
        const knobX = sliderX + sliderW * ratio;
        ctx.fillStyle = isModified ? '#dd88ff' : '#88aaff';
        ctx.beginPath();
        ctx.arc(knobX, sliderY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scroll indicator for settings
      const contentH = SETTINGS_DEFS.length * SETTINGS_ROW_H + 20;
      if (contentH > listH) {
        const barH = Math.max(20, listH * listH / contentH);
        const barY = listTop + (editorState.scrollY / (contentH - listH)) * (listH - barH);
        ctx.fillStyle = 'rgba(100,100,180,0.5)';
        ctx.fillRect(W - 4, barY, 4, barH);
      }
    } else {
      // ── Config tabs: two-column field list ──
      const fields = editorState.fields;
      const scrollY = editorState.scrollY;
      const valueColX = W * LABEL_COL;

      for (let i = 0; i < fields.length; i++) {
        const fy = listTop + i * ROW_H - scrollY;
        if (fy + ROW_H < listTop || fy > listTop + listH) continue;

        const f = fields[i];
        if (f.isHeader) {
          ctx.fillStyle = '#2a2a5e';
          ctx.fillRect(0, fy, W, ROW_H);
          ctx.fillStyle = '#8888cc';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(f.label, 10, fy + ROW_H / 2 + 5);
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#14142a' : '#1a1a32';
          ctx.fillRect(0, fy, W, ROW_H);

          ctx.fillStyle = f.isModified ? '#ffdd44' : '#aaaacc';
          ctx.font = '12px monospace';
          ctx.textAlign = 'left';
          const labelText = f.label.length > 30 ? '…' + f.label.slice(-29) : f.label;
          ctx.fillText(labelText, 8, fy + ROW_H / 2 + 5);

          ctx.strokeStyle = '#333355';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(valueColX, fy);
          ctx.lineTo(valueColX, fy + ROW_H);
          ctx.stroke();

          if (editorState._inputFieldIdx !== i) {
            const displayVal = typeof f.value === 'number' && !Number.isInteger(f.value)
              ? f.value.toFixed(3) : String(f.value);
            ctx.fillStyle = f.isModified ? '#ffdd44' : '#88aaff';
            ctx.font = `${f.isModified ? 'bold ' : ''}13px monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(displayVal, W - 8, fy + ROW_H / 2 + 5);
          }
        }
      }

      // Scroll indicator
      const totalH = fields.length * ROW_H;
      if (totalH > listH) {
        const barH = Math.max(20, listH * listH / totalH);
        const barY = listTop + (editorState.scrollY / (totalH - listH)) * (listH - barH);
        ctx.fillStyle = 'rgba(100,100,180,0.5)';
        ctx.fillRect(W - 4, barY, 4, barH);
      }

      // Modified count badge
      const modCount = fields.filter(f => !f.isHeader && f.isModified).length;
      if (modCount > 0) {
        ctx.fillStyle = '#ffdd44';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${modCount} modified`, W - 8, H - BOTTOM_H - 4);
      }
    }

    ctx.restore();

    // ── Bottom buttons ──
    const isSettings = editorState.activeTab === 'settings';
    const btnLabels = isSettings ? ['重設預設值', '← 返回'] : ['匯出 JSON', '匯入 JSON', '重設預設值', '← 返回'];
    const btnW = isSettings ? 140 : 110;
    const gap = 10;
    const totalBW = btnLabels.length * btnW + (btnLabels.length - 1) * gap;
    const startX = (W - totalBW) / 2;
    const btnY = H - BOTTOM_H + 8;
    const btnH = 34;

    for (let i = 0; i < btnLabels.length; i++) {
      const bx = startX + i * (btnW + gap);
      const isReset = btnLabels[i].startsWith('重設');
      const isBack = btnLabels[i].startsWith('←');
      ctx.fillStyle = isReset ? '#4e1a1a' : (isBack ? '#1a1a4e' : '#1a3a1a');
      ctx.fillRect(bx, btnY, btnW, btnH);
      ctx.strokeStyle = isReset ? '#cc4444' : (isBack ? '#4466cc' : '#44aa44');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, btnY, btnW, btnH);
      ctx.fillStyle = '#ccccee';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btnLabels[i], bx + btnW / 2, btnY + btnH / 2 + 5);
    }
  }
}
