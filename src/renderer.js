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
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title with gold border
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('選擇技能', canvas.width / 2, canvas.height * 0.15);

    // Cards (same layout as level-up)
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

      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(bx, cardY, cardW, cardH);
      ctx.strokeStyle = '#ffdd44';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, cardY, cardW, cardH);

      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(skill.icon, bx + cardW / 2, cardY + 35);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffdd44';
      ctx.fillText(skill.name, bx + cardW / 2, cardY + 58);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#aaaacc';
      const desc = skill.description;
      if (desc.length > 10) {
        ctx.fillText(desc.substring(0, 10), bx + cardW / 2, cardY + 78);
        ctx.fillText(desc.substring(10), bx + cardW / 2, cardY + 93);
      } else {
        ctx.fillText(desc, bx + cardW / 2, cardY + 85);
      }
    }
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
      const size = (chest.radius + pulse) * 2.2;
      ctx.save();
      ctx.font = `${Math.round(size)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', sx, sy);
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
    const ctx = this.ctx;
    for (const barrel of barrels) {
      if (!barrel.alive) continue;
      const sx = barrel.x - camera.x;
      const sy = barrel.y - camera.y;
      const size = barrel.radius * 2.5;
      ctx.save();
      ctx.font = `${Math.round(size)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛢️', sx, sy);
      ctx.restore();
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

    // Draw emoji icon
    ctx.save();
    ctx.font = `${Math.round(r * 2.4)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.icon || '🗡️', sx, sy);
    ctx.restore();

    // Hit flash overlay
    if (player.hitFlashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Direction indicator (small line in front of player)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + player.facingX * r, sy + player.facingY * r);
    ctx.lineTo(sx + player.facingX * (r + 7), sy + player.facingY * (r + 7));
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

      // Draw emoji icon
      ctx.save();
      ctx.font = `${Math.round(r * 2.4)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.icon, sx, sy);
      ctx.restore();

      // Hit flash overlay
      if (e.hitFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Frozen overlay
      if (e.frozen > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#88ddff';
        ctx.beginPath();
        ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Poisoned overlay
      if (e.poisoned > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#66ff44';
        ctx.beginPath();
        ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawPickups(pickups, camera, elapsed = 0) {
    const ctx = this.ctx;
    for (const p of pickups) {
      if (!p.alive) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      const pulse = Math.sin(elapsed * 5 + p.x * 0.2) * 1.5;
      const size = (p.radius + pulse) * 2.6;

      ctx.save();
      ctx.font = `${Math.round(size)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'hp' ? (p.hpValue >= 40 ? '🧪' : '💗') : '💎', sx, sy);
      ctx.restore();
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
      for (const def of getSkillDefs()) {
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
    // Anchor content at 38% of screen height so it sits in the upper portion
    // rather than dead-center, which leaves too much empty space on tall phones.
    const anchorY = Math.round(canvas.height * 0.38);

    ctx.fillStyle = CONFIG.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CrazyGaGa', cx, anchorY - 60);

    // Subtitle
    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.fillText('Dungeon Archer · Horde Survival', cx, anchorY - 20);

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

    // Mode buttons
    const modeBtnW = 160;
    const modeBtnH = 50;
    const modeGap = 20;
    const modeTotalW = modeBtnW * 2 + modeGap;
    const modeStartX = cx - modeTotalW / 2;
    const modeBtnY = anchorY + 200;

    const modeButtons = [
      { label: '🏹 地城模式', color: '#003366', border: '#00aaff' },
      { label: '⚔️ 生存模式', color: '#332200', border: '#ffaa00' },
    ];
    for (let i = 0; i < 2; i++) {
      const bx = modeStartX + i * (modeBtnW + modeGap);
      ctx.fillStyle = modeButtons[i].color;
      ctx.fillRect(bx, modeBtnY, modeBtnW, modeBtnH);
      ctx.strokeStyle = modeButtons[i].border;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, modeBtnY, modeBtnW, modeBtnH);
      ctx.fillStyle = '#ffffff';
      ctx.font = '15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(modeButtons[i].label, bx + modeBtnW / 2, modeBtnY + 32);
    }

    // Controls
    ctx.fillStyle = '#666688';
    ctx.font = '13px monospace';
    ctx.fillText('WASD / 虛擬搖桿 移動', cx, anchorY + 100);

    // Row of 3 buttons: 商店, 角色, 設定
    const btnW = 90;
    const btnH = 40;
    const gap = 15;
    const totalW = btnW * 3 + gap * 2;
    const startX = cx - totalW / 2;
    const btnY = anchorY + 140;
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

    // Version — bottom-left
    ctx.fillStyle = '#6666aa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`v${VERSION}`, 12, canvas.height - 10);

  }

  drawChapterSelect(canvas, meta, chapters) {
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
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('選擇章節', cx, canvas.height * 0.18);

    // Chapter info
    const chapterMeta = [
      { icon: '🌲', difficulty: '★', diffLabel: 'Normal', color: '#44aa66' },
      { icon: '🌋', difficulty: '★★', diffLabel: 'Hard', color: '#dd8833' },
      { icon: '❄️', difficulty: '★★★', diffLabel: 'Expert', color: '#4488dd' },
    ];

    const cardW = Math.min(320, canvas.width - 40);
    const cardH = 90;
    const cardGap = 16;
    const cardX = cx - cardW / 2;
    const startY = canvas.height * 0.28;

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const cm = chapterMeta[i] || { icon: '?', difficulty: '?', diffLabel: '', color: '#666' };
      const cy = startY + i * (cardH + cardGap);
      const unlocked = meta && (i === 0 || (meta.clearedChapters || []).includes(i - 1));
      const cleared = meta && (meta.clearedChapters || []).includes(i);

      // Card background
      ctx.fillStyle = unlocked ? '#1a1a3e' : '#111122';
      ctx.fillRect(cardX, cy, cardW, cardH);

      // Card border
      ctx.strokeStyle = unlocked ? cm.color : '#333355';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cy, cardW, cardH);

      if (!unlocked) {
        // Locked state
        ctx.fillStyle = '#444466';
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', cx, cy + 54);
        ctx.font = '14px monospace';
        ctx.fillText('通關前一章節以解鎖', cx, cy + 78);
      } else {
        // Chapter icon + name
        ctx.font = '28px serif';
        ctx.textAlign = 'left';
        ctx.fillText(cm.icon, cardX + 16, cy + 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`第${ch.id}章  ${ch.name}`, cardX + 56, cy + 32);

        // Difficulty
        ctx.fillStyle = cm.color;
        ctx.font = '13px monospace';
        ctx.fillText(`${cm.difficulty} ${cm.diffLabel}`, cardX + 56, cy + 54);

        // Cleared badge
        if (cleared) {
          ctx.fillStyle = '#44dd44';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('✓ 已通關', cardX + cardW - 12, cy + 32);
        } else {
          ctx.fillStyle = '#aaaacc';
          ctx.font = '12px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('未通關', cardX + cardW - 12, cy + 32);
        }

        // Room count
        ctx.fillStyle = '#888899';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${ch.rooms.length} 房間`, cardX + cardW - 12, cy + 54);

        // Play hint
        ctx.fillStyle = '#aaaacc';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('點擊開始', cx, cy + cardH - 10);
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
