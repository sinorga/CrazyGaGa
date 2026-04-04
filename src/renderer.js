import { CONFIG } from './config.js';
import { SETTINGS_DEFS } from './settings.js';
import { UPGRADE_DEFINITIONS } from './data/upgrades.js';
import { CHARACTER_DEFINITIONS } from './data/characters.js';
import { SKILL_DEFINITIONS } from './data/skills.js';

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
  }

  clear(camera) {
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMap(camera) {
    const ctx = this.ctx;
    const map = CONFIG.map;
    const gs = map.gridSize;

    // Grid
    ctx.strokeStyle = map.gridColor;
    ctx.lineWidth = 1;

    const startX = Math.floor(camera.x / gs) * gs;
    const startY = Math.floor(camera.y / gs) * gs;
    const endX = camera.x + this.canvas.width;
    const endY = camera.y + this.canvas.height;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gs) {
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, this.canvas.height);
    }
    for (let y = startY; y <= endY; y += gs) {
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(this.canvas.width, y - camera.y);
    }
    ctx.stroke();

    // Border
    ctx.strokeStyle = map.borderColor;
    ctx.lineWidth = map.borderWidth;
    ctx.strokeRect(-camera.x, -camera.y, map.width, map.height);
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

    // Hit flash
    const isFlash = player.hitFlashTimer > 0;
    ctx.fillStyle = isFlash ? '#ffffff' : CONFIG.player.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + player.facingX * r * 1.5, sy + player.facingY * r * 1.5);
    ctx.stroke();
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

      // Hit flash
      const isFlash = e.hitFlashTimer > 0;
      ctx.fillStyle = isFlash ? '#ffffff' : e.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // HP bar (only if damaged)
      if (e.hp < e.maxHp) {
        const barW = e.radius * 2;
        const barH = 3;
        const barY = sy - e.radius - 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(sx - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
      }
    }
  }

  drawProjectiles(projectiles, camera) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawEnemyProjectiles(projectiles, camera) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.fillStyle = p.color || '#ff66aa';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPickups(pickups, camera, elapsed = 0) {
    const ctx = this.ctx;
    for (const p of pickups) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      const pulse = Math.sin(elapsed * 5 + p.x * 0.2) * 2;

      // Diamond shape for EXP gems
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      const s = p.radius + pulse;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();

      // Pulsing glow ring
      const glowAlpha = 0.2 + Math.sin(elapsed * 5 + p.x * 0.2) * 0.15;
      ctx.globalAlpha = glowAlpha;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius + 4 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  drawOrbitWeapons(weapons, camera) {
    const ctx = this.ctx;
    for (const weapon of weapons) {
      if (weapon.type === 'orbit' && weapon.orbs) {
        for (const orb of weapon.orbs) {
          const sx = orb.x - camera.x;
          const sy = orb.y - camera.y;
          ctx.fillStyle = orb.color;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(sx, sy, orb.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Chain lightning visual
      if (weapon.type === 'chain' && weapon.chainTargets && weapon.chainTimer > 0) {
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = weapon.chainTimer / weapon.config.duration;
        ctx.beginPath();
        for (let i = 0; i < weapon.chainTargets.length; i++) {
          const t = weapon.chainTargets[i];
          const sx = t.x - camera.x;
          const sy = t.y - camera.y;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Area effects
      if (weapon.areas) {
        for (const area of weapon.areas) {
          const sx = area.x - camera.x;
          const sy = area.y - camera.y;
          const alpha = Math.min(1, area.timer / area.duration * 2);
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillStyle = area.color;
          ctx.beginPath();
          ctx.arc(sx, sy, area.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  drawHUD(player, elapsed, runGold, skillLevels) {
    const ctx = this.ctx;
    const ui = CONFIG.ui;

    const hpBarX = (this.canvas.width - ui.hpBarWidth) / 2;
    const hpBarY = 15;

    // HP bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(hpBarX, hpBarY, ui.hpBarWidth, ui.hpBarHeight);

    // HP bar fill
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    const hpColor = hpPercent > 0.5 ? '#44dd44' : hpPercent > 0.25 ? '#dddd44' : '#dd4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, ui.hpBarWidth * hpPercent, ui.hpBarHeight);

    // HP bar border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, ui.hpBarWidth, ui.hpBarHeight);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, this.canvas.width / 2, hpBarY + ui.hpBarHeight - 3);

    // EXP bar
    const expBarY = hpBarY + ui.hpBarHeight + 3;
    ctx.fillStyle = '#222';
    ctx.fillRect(hpBarX, expBarY, ui.hpBarWidth, ui.expBarHeight);
    const expPercent = player.exp / player.expToNextLevel();
    ctx.fillStyle = '#6688ff';
    ctx.fillRect(hpBarX, expBarY, ui.hpBarWidth * Math.min(1, expPercent), ui.expBarHeight);

    // Level (top-left)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${player.level}`, 10, 28);

    // Timer (top-center, above HP bar)
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.textAlign = 'center';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, this.canvas.width / 2, 12);

    // Kill count & Gold (top-left, below level)
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Kills: ${player.kills}`, 10, 46);
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`Gold: ${Math.floor(runGold || 0)}`, 10, 62);

    // Acquired skills display (below kills/gold, wrapping to multiple rows)
    if (skillLevels) {
      let sx = 10;
      let sy = 78;
      const iconW = 30;
      const maxX = this.canvas.width / 2 - 10; // don't overlap HP bar
      ctx.font = '11px monospace';
      for (const def of SKILL_DEFINITIONS) {
        const lv = skillLevels[def.id] || 0;
        if (lv > 0) {
          if (sx + iconW > maxX) {
            sx = 10;
            sy += 16;
          }
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${def.icon}${lv}`, sx, sy);
          sx += iconW;
        }
      }
    }

    // Pause button (top-right)
    const pbX = this.canvas.width - 50;
    const pbY = 10;
    ctx.fillStyle = 'rgba(40, 40, 70, 0.7)';
    ctx.fillRect(pbX, pbY, 40, 40);
    ctx.strokeStyle = '#6666aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(pbX, pbY, 40, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⏸', pbX + 20, pbY + 28);
  }

  drawBossHPBar(boss) {
    if (!boss || !boss.alive) return;
    const ctx = this.ctx;
    const barWidth = this.canvas.width * 0.6;
    const barHeight = 14;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 55;

    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP fill
    const hpPercent = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Boss name
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.typeDef.name, this.canvas.width / 2, barY - 4);
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

    if (t > 1.0) {
      // Phase 1: darkening + WARNING text
      const phase = (2.0 - t); // 0→1
      const darkAlpha = Math.min(0.4, phase * 0.4);
      ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pulsing WARNING text
      const pulse = Math.sin(phase * 12) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff2222';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ WARNING ⚠', cx, canvas.height * 0.4);
      ctx.globalAlpha = 1;
    } else {
      // Phase 2: boss name + fade out
      const darkAlpha = t * 0.4; // fading out
      ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = Math.min(1, (1.0 - t) * 2);
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bossEntrance.bossName || 'BOSS', cx, canvas.height * 0.4);
      ctx.globalAlpha = 1;
    }
  }

  drawPauseOverlay(canvas) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲暫停', cx, canvas.height / 2 - 60);

    // Resume button
    const btnW = 180;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const resumeY = canvas.height / 2 - 10;

    ctx.fillStyle = '#2a4e2a';
    ctx.fillRect(btnX, resumeY, btnW, btnH);
    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, resumeY, btnW, btnH);
    ctx.fillStyle = '#44dd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('繼續遊戲', cx, resumeY + 32);

    // Exit button
    const exitY = canvas.height / 2 + 60;
    ctx.fillStyle = '#4e2a2a';
    ctx.fillRect(btnX, exitY, btnW, btnH);
    ctx.strokeStyle = '#aa4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, exitY, btnW, btnH);
    ctx.fillStyle = '#dd4444';
    ctx.fillText('離開遊戲', cx, exitY + 32);
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

  drawLevelUpPanel(skillChoices, canvas) {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title at top
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('升級！選擇技能', canvas.width / 2, canvas.height * 0.15);

    // Horizontal card layout at ~35% of screen
    const count = skillChoices.length;
    const gap = 10;
    const cardW = Math.min(140, (canvas.width - gap * (count + 1)) / count);
    const cardH = 120;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (canvas.width - totalW) / 2;
    const cardY = canvas.height * 0.22;

    for (let i = 0; i < count; i++) {
      const skill = skillChoices[i];
      const bx = startX + i * (cardW + gap);

      // Card background
      ctx.fillStyle = '#2a2a4e';
      ctx.fillRect(bx, cardY, cardW, cardH);
      ctx.strokeStyle = '#6666aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, cardY, cardW, cardH);

      // Icon
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(skill.icon, bx + cardW / 2, cardY + 35);

      // Name
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(skill.name, bx + cardW / 2, cardY + 60);

      // Description (wrap if needed)
      ctx.font = '10px monospace';
      ctx.fillStyle = '#aaaacc';
      const desc = skill.description;
      if (desc.length > 10) {
        ctx.fillText(desc.substring(0, 10), bx + cardW / 2, cardY + 80);
        ctx.fillText(desc.substring(10), bx + cardW / 2, cardY + 95);
      } else {
        ctx.fillText(desc, bx + cardW / 2, cardY + 85);
      }
    }
  }

  drawGameOver(player, elapsed, canvas, runGold) {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Title
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束', cx, canvas.height / 2 - 80);

    // Stats
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillText(`存活時間: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cx, canvas.height / 2 - 30);
    ctx.fillText(`擊殺數: ${player.kills}`, cx, canvas.height / 2 + 5);
    ctx.fillText(`等級: ${player.level}`, cx, canvas.height / 2 + 40);

    // Gold earned
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`獲得金幣: ${Math.floor(runGold || 0)}`, cx, canvas.height / 2 + 75);

    // Restart prompt
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('點擊重新開始', cx, canvas.height / 2 + 120);
  }

  drawVictory(player, elapsed, canvas, runGold) {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Title
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('勝利！', cx, canvas.height / 2 - 80);

    // Subtitle
    ctx.fillStyle = '#44dd44';
    ctx.font = '20px monospace';
    ctx.fillText('恭喜通關！', cx, canvas.height / 2 - 45);

    // Stats
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillText(`通關時間: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cx, canvas.height / 2 + 0);
    ctx.fillText(`擊殺數: ${player.kills}`, cx, canvas.height / 2 + 35);
    ctx.fillText(`等級: ${player.level}`, cx, canvas.height / 2 + 70);

    // Gold earned (doubled)
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`獲得金幣: ${Math.floor(runGold || 0)} (2x)`, cx, canvas.height / 2 + 105);

    // Return prompt
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('點擊返回主選單', cx, canvas.height / 2 + 150);
  }

  drawMenu(canvas, meta) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CrazyGaGa', cx, canvas.height / 2 - 60);

    // Subtitle
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.fillText('Roguelite 割草生存', cx, canvas.height / 2 - 20);

    // Selected character & gold
    if (meta) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '14px monospace';
      ctx.fillText(`金幣: ${meta.gold}`, cx, canvas.height / 2 + 15);
      const charDef = CHARACTER_DEFINITIONS.find(c => c.id === meta.selected);
      if (charDef) {
        ctx.fillStyle = charDef.color;
        ctx.fillText(`角色: ${charDef.name}`, cx, canvas.height / 2 + 35);
      }
    }

    // Start prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('點擊開始遊戲', cx, canvas.height / 2 + 65);

    // Controls
    ctx.fillStyle = '#666688';
    ctx.font = '13px monospace';
    ctx.fillText('WASD / 虛擬搖桿 移動', cx, canvas.height / 2 + 100);
    ctx.fillText('靜止時自動攻擊', cx, canvas.height / 2 + 118);

    // Row of 3 buttons: 商店, 角色, 設定
    const btnW = 90;
    const btnH = 40;
    const gap = 15;
    const totalW = btnW * 3 + gap * 2;
    const startX = cx - totalW / 2;
    const btnY = canvas.height / 2 + 140;
    const labels = ['商店', '角色', '設定'];

    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (btnW + gap);
      ctx.fillStyle = '#2a2a4e';
      ctx.fillRect(bx, btnY, btnW, btnH);
      ctx.strokeStyle = '#6666aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, btnY, btnW, btnH);
      ctx.fillStyle = '#aaaacc';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], bx + btnW / 2, btnY + 26);
    }
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

    for (let i = 0; i < UPGRADE_DEFINITIONS.length; i++) {
      const def = UPGRADE_DEFINITIONS[i];
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

    for (let i = 0; i < CHARACTER_DEFINITIONS.length; i++) {
      const def = CHARACTER_DEFINITIONS[i];
      const y = startY + i * (cardH + gap);
      const unlocked = meta.unlocked.includes(def.id);
      const selected = meta.selected === def.id;

      // Card background
      ctx.fillStyle = selected ? '#2a2a5e' : '#1e1e3e';
      ctx.fillRect(cardX, y, cardW, cardH);
      ctx.strokeStyle = selected ? '#6688ff' : (unlocked ? '#4444aa' : '#333355');
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, y, cardW, cardH);

      // Color dot
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(cardX + 25, y + 30, 10, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, cardX + 45, y + 35);

      // Description
      ctx.fillStyle = '#8888aa';
      ctx.font = '12px monospace';
      ctx.fillText(def.description, cardX + 45, y + 55);

      // Stats
      ctx.fillStyle = '#aaaacc';
      ctx.font = '11px monospace';
      ctx.fillText(`HP:${def.baseStats.maxHp} SPD:${def.baseStats.speed}`, cardX + 45, y + 75);

      // Status
      ctx.textAlign = 'right';
      if (!unlocked) {
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`🔒 ${def.unlockCost}g`, cardX + cardW - 15, y + 40);
      } else if (selected) {
        ctx.fillStyle = '#66ff66';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('✓ 使用中', cardX + cardW - 15, y + 40);
      } else {
        ctx.fillStyle = '#aaaacc';
        ctx.font = '14px monospace';
        ctx.fillText('點擊選擇', cardX + cardW - 15, y + 40);
      }
    }
  }

  drawSettingsPage(canvas, settingsValues, scrollY) {
    const ctx = this.ctx;
    const cx = canvas.width / 2;

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Back button (top-left)
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('← 返回', 15, 32);

    // Reset button (top-right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('重置預設', canvas.width - 15, 32);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲設定', cx, 60);

    // Slider rows
    const sliderW = 220;
    const sliderX = cx - sliderW / 2;
    const rowH = 55;
    const startY = 80 - scrollY;

    ctx.save();
    // Clip to below header
    ctx.beginPath();
    ctx.rect(0, 70, canvas.width, canvas.height - 70);
    ctx.clip();

    for (let i = 0; i < SETTINGS_DEFS.length; i++) {
      const def = SETTINGS_DEFS[i];
      const y = startY + i * rowH;
      const sliderY = y + 30;
      const value = settingsValues[def.key] ?? def.default;

      // Label
      ctx.fillStyle = '#ccccee';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.label, sliderX, y + 15);

      // Value display
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffdd44';
      const displayVal = def.step < 1 ? value.toFixed(2) : Math.round(value);
      ctx.fillText(String(displayVal), sliderX + sliderW, y + 15);

      // Slider track
      ctx.fillStyle = '#333355';
      ctx.fillRect(sliderX, sliderY - 4, sliderW, 8);

      // Slider fill
      const ratio = (value - def.min) / (def.max - def.min);
      ctx.fillStyle = '#4466aa';
      ctx.fillRect(sliderX, sliderY - 4, sliderW * ratio, 8);

      // Slider knob
      const knobX = sliderX + sliderW * ratio;
      ctx.fillStyle = '#88aaff';
      ctx.beginPath();
      ctx.arc(knobX, sliderY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
