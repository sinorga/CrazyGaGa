import { CONFIG } from './config.js';

export class Renderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
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

  drawPlayer(player, camera) {
    const ctx = this.ctx;
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    // Skip drawing if invincible and in blink phase
    if (player.invincible && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      return;
    }

    // Body
    ctx.fillStyle = CONFIG.player.color;
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + player.facingX * player.radius * 1.5, sy + player.facingY * player.radius * 1.5);
    ctx.stroke();
  }

  drawEnemies(enemies, camera) {
    const ctx = this.ctx;
    for (const e of enemies) {
      if (!e.alive) continue;
      const sx = e.x - camera.x;
      const sy = e.y - camera.y;

      // Skip if off screen
      if (sx < -50 || sx > this.canvas.width + 50 || sy < -50 || sy > this.canvas.height + 50) continue;

      // Body
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(sx, sy, e.radius, 0, Math.PI * 2);
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

  drawPickups(pickups, camera) {
    const ctx = this.ctx;
    for (const p of pickups) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      // Diamond shape for EXP gems
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius);
      ctx.restore();

      // Glow
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius + 3, 0, Math.PI * 2);
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

  drawHUD(player, elapsed) {
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

    // Level
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${player.level}`, 10, 28);

    // Timer
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.textAlign = 'right';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, this.canvas.width - 10, 28);

    // Kill count
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    ctx.fillText(`Kills: ${player.kills}`, this.canvas.width - 10, 46);
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

    // Title
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('升級！選擇技能', canvas.width / 2, 80);

    // Skill buttons
    const buttonW = 280;
    const buttonH = 80;
    const gap = 10;
    const totalH = skillChoices.length * (buttonH + gap);
    const startY = (canvas.height - totalH) / 2;

    for (let i = 0; i < skillChoices.length; i++) {
      const skill = skillChoices[i];
      const bx = canvas.width / 2 - buttonW / 2;
      const by = startY + i * (buttonH + gap);

      // Button background
      ctx.fillStyle = '#2a2a4e';
      ctx.fillRect(bx, by, buttonW, buttonH);
      ctx.strokeStyle = '#6666aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, buttonW, buttonH);

      // Icon
      ctx.font = '28px serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(skill.icon, bx + 12, by + 42);

      // Name
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(skill.name, bx + 55, by + 30);

      // Description
      ctx.font = '12px monospace';
      ctx.fillStyle = '#aaaacc';
      ctx.fillText(skill.description, bx + 55, by + 55);
    }
  }

  drawGameOver(player, elapsed, canvas) {
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

    // Restart prompt
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('點擊重新開始', cx, canvas.height / 2 + 100);
  }

  drawMenu(canvas) {
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

    // Start prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('點擊開始遊戲', cx, canvas.height / 2 + 40);

    // Controls
    ctx.fillStyle = '#666688';
    ctx.font = '13px monospace';
    ctx.fillText('WASD / 虛擬搖桿 移動', cx, canvas.height / 2 + 90);
    ctx.fillText('靜止時自動攻擊', cx, canvas.height / 2 + 112);
  }
}
