// VELVET VAULT — everything that is drawn.
// A dark museum at night: navy floors, lamplit cones, gold under glass.
// The HUD keeps the alarm meter front and centre at all times, because the
// screenshot of a heist should read in one glance: thief, cones, cameras,
// loot, alarm.

import {
  TILE, MAP_W, MAP_H, VIEW_W, VIEW_H, GUARD_SIGHT, GUARD_HALF_ANGLE,
  CAMERA_SIGHT, CAMERA_HALF_ANGLE, ALARM_MAX, COLOURS,
} from './config.js';
import { conePolygon } from './vision.js';

// Deterministic floor speckle, so every frame (and every screenshot) agrees.
const SPECKLES = [];
{
  let seed = 1234567;
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 340; i++) SPECKLES.push({ x: rand() * VIEW_W, y: rand() * VIEW_H, r: rand() * 1.6 + 0.4 });
}

function drawFloor(ctx, level) {
  ctx.fillStyle = '#0c101f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const [x, y, w, h, colour] of level.roomTints) {
    ctx.fillStyle = colour;
    ctx.fillRect(x * TILE, y * TILE, w * TILE, h * TILE);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (const s of SPECKLES) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.028)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < MAP_W; x++) { ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, VIEW_H); }
  for (let y = 1; y < MAP_H; y++) { ctx.moveTo(0, y * TILE); ctx.lineTo(VIEW_W, y * TILE); }
  ctx.stroke();
  // Room names, lettered faintly on the floor like a museum plan.
  ctx.fillStyle = 'rgba(220,228,255,0.13)';
  ctx.font = '600 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('WEST GALLERY', 1.3 * TILE, 11.6 * TILE);
  ctx.fillText('FOYER', 1.3 * TILE, 18.7 * TILE);
  ctx.fillText('ATRIUM', 11.3 * TILE, 8.7 * TILE);
  ctx.fillText('CENTRAL HALL', 11.3 * TILE, 18.7 * TILE);
  ctx.fillText('EAST GALLERY', 22.3 * TILE, 18.7 * TILE);
  ctx.fillText('THE VAULT', 22.3 * TILE, 5.7 * TILE);
}

function drawWalls(ctx, level) {
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (!level.isWall(tx, ty)) continue;
      const x = tx * TILE, y = ty * TILE;
      ctx.fillStyle = COLOURS.wall;
      ctx.fillRect(x, y, TILE, TILE);
      if (!level.isWall(tx, ty - 1)) { ctx.fillStyle = COLOURS.wallTop; ctx.fillRect(x, y, TILE, 5); }
      if (!level.isWall(tx, ty + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y + TILE - 4, TILE, 4); }
    }
  }
}

function drawExit(ctx, game) {
  const pulse = game.thief.hasStar ? 0.65 + 0.35 * Math.sin(game.time * 6) : 0.4;
  const x = 4 * TILE, w = 2 * TILE, y = (MAP_H - 1) * TILE;
  ctx.fillStyle = `rgba(89, 217, 119, ${0.25 * pulse})`;
  ctx.fillRect(x, y, w, TILE);
  ctx.strokeStyle = `rgba(89, 217, 119, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, TILE - 4);
  ctx.fillStyle = `rgba(190, 255, 205, ${0.55 + 0.45 * pulse})`;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + w / 2, y + 26);
}

function drawLoot(ctx, game, item) {
  if (item.taken) return;
  const x = item.tx * TILE + TILE / 2, y = item.ty * TILE + TILE / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(244, 197, 66, 0.8)';
  ctx.shadowBlur = item.kind === 'star' ? 22 : 10;
  if (item.kind === 'painting') {
    ctx.fillStyle = '#8a6a25';
    ctx.fillRect(x - 15, y - 12, 30, 24);
    ctx.fillStyle = item.id.includes('sun') ? '#c9541e' : '#1e6f7a';
    ctx.fillRect(x - 11, y - 8, 22, 16);
    ctx.fillStyle = '#f4c542';
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
  } else if (item.kind === 'gold') {
    ctx.fillStyle = '#d9a92c';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - 13 + (i % 2) * 5, y + 4 - i * 7, 20, 6);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(x - 13, y - 10, 20, 3);
  } else if (item.kind === 'vase') {
    ctx.fillStyle = '#2fa39a';
    ctx.beginPath(); ctx.ellipse(x, y + 3, 8, 10, 0, 0, 7); ctx.fill();
    ctx.fillRect(x - 4, y - 11, 8, 6);
    ctx.fillStyle = '#bff3ec';
    ctx.fillRect(x - 4, y - 12, 8, 2);
  } else if (item.kind === 'star') {
    const r = 13 + Math.sin(game.time * 3) * 1.6;
    ctx.shadowColor = 'rgba(126, 240, 212, 0.95)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = COLOURS.gem;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.72, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.72, y);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.45); ctx.lineTo(x + r * 0.3, y); ctx.lineTo(x, y + r * 0.45); ctx.lineTo(x - r * 0.3, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (item.kind === 'star') {
    ctx.strokeStyle = 'rgba(126, 240, 212, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 21 + Math.sin(game.time * 3) * 2.5, 0, 7); ctx.stroke();
  }
}

function drawCone(ctx, level, eye, facing, halfAngle, reach, colour) {
  const poly = conePolygon(level, eye, facing, halfAngle, reach);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, game, guard) {
  const alert = guard.mode === 'chase';
  const warm = guard.suspicion > 0.3;
  const colour = alert ? 'rgba(255, 70, 40, 0.20)' : warm ? 'rgba(255, 150, 50, 0.17)' : 'rgba(255, 214, 90, 0.13)';
  drawCone(ctx, game.level, guard, guard.facing, GUARD_HALF_ANGLE, GUARD_SIGHT, colour);
  // Body: navy uniform, cap brim toward facing.
  ctx.fillStyle = alert ? COLOURS.guardAlert : COLOURS.guard;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius, 0, 7); ctx.fill();
  ctx.fillStyle = '#16233f';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius - 5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#dfe8ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (guard.radius + 3), guard.y + Math.sin(guard.facing) * (guard.radius + 3));
  ctx.stroke();
  if (guard.suspicion > 0.05 && !alert) {
    ctx.strokeStyle = 'rgba(255, 170, 60, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - guard.radius - 9, 6, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
    ctx.stroke();
  }
  if (alert) {
    ctx.fillStyle = '#ff5a3c';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - guard.radius - 6);
  }
}

function drawCamera(ctx, game, camera) {
  const colour = camera.seesThief > 0 ? 'rgba(255, 80, 60, 0.16)' : 'rgba(130, 200, 255, 0.10)';
  drawCone(ctx, game.level, camera, camera.facing, CAMERA_HALF_ANGLE, CAMERA_SIGHT, colour);
  ctx.fillStyle = '#1b2238';
  ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
  ctx.strokeStyle = '#5f6f9e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(camera.x - 9, camera.y - 7, 18, 14);
  ctx.fillStyle = camera.seesThief > 0 ? '#ff5040' : '#9fd8ff';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.facing) * 6, camera.y + Math.sin(camera.facing) * 6, 3.2, 0, 7);
  ctx.fill();
}

function drawThief(ctx, game) {
  const t = game.thief;
  // A soft ring marks the sneaking thief, low to the ground.
  if (t.sneaking) {
    ctx.strokeStyle = 'rgba(232, 228, 218, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.radius + 5, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = COLOURS.thiefCloak;
  ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, 7); ctx.fill();
  ctx.fillStyle = COLOURS.thief;
  ctx.beginPath(); ctx.arc(t.x, t.y - 2, t.radius - 5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#10131f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y - 2);
  ctx.lineTo(t.x + Math.cos(t.facing) * (t.radius - 2), t.y - 2 + Math.sin(t.facing) * (t.radius - 2));
  ctx.stroke();
  if (t.hasStar) {
    ctx.fillStyle = COLOURS.gem;
    ctx.beginPath(); ctx.arc(t.x + 9, t.y + 8, 3.6, 0, 7); ctx.fill();
  }
}

function drawCoinFx(ctx, game) {
  for (const coin of game.coinFx) {
    const age = game.time - coin.t;
    if (age < 0 || age > 2.6) continue;
    ctx.strokeStyle = `rgba(244, 197, 66, ${0.7 * (1 - age / 2.6)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6 + age * 22, 0, 7); ctx.stroke();
    ctx.fillStyle = COLOURS.gold;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 4, 0, 7); ctx.fill();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(5, 7, 14, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(0, 46, VIEW_W, 1);
  ctx.fillStyle = '#cfd8f5';
  ctx.font = '700 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET VAULT', 16, 29);

  // The alarm meter, centre stage.
  const bx = 400, bw = 480, by = 13, bh = 18;
  const frac = game.alarm.level / ALARM_MAX;
  ctx.fillStyle = '#39406b';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', bx - 10, by + 14);
  ctx.fillStyle = '#1a1f36';
  ctx.fillRect(bx, by, bw, bh);
  const hue = frac < 0.33 ? '#e8b93c' : frac < 0.66 ? '#ff8b3d' : '#ff4747';
  ctx.fillStyle = hue;
  ctx.fillRect(bx, by, bw * frac, bh);
  ctx.strokeStyle = game.alarm.seenNow && Math.sin(game.time * 10) > 0 ? '#ffffff' : '#5f6f9e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, bw, bh);
  if (game.alarm.seenNow) {
    ctx.fillStyle = '#ff6a55';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPOTTED!', bx + bw + 12, by + 14);
  }

  // Haul and kit, right side.
  ctx.fillStyle = '#cfd8f5';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textAlign = 'right';
  const mins = Math.floor(game.elapsed / 60), secs = Math.floor(game.elapsed % 60);
  ctx.fillText(`Loot ${game.lootTaken}/${game.level.loot.length}   Score ${game.score}   Coins ${game.coinsLeft}   ${mins}:${String(secs).padStart(2, '0')}`, VIEW_W - 16, 29);
}

function drawMinimap(ctx, game) {
  const s = 4, w = MAP_W * s, h = MAP_H * s, x0 = VIEW_W - w - 12, y0 = VIEW_H - h - 12;
  ctx.fillStyle = 'rgba(5, 7, 14, 0.72)';
  ctx.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    ctx.fillStyle = game.level.isWall(tx, ty) ? '#3a4568' : '#161d33';
    ctx.fillRect(x0 + tx * s, y0 + ty * s, s, s);
  }
  ctx.fillStyle = COLOURS.exit;
  ctx.fillRect(x0 + 4 * s, y0 + 19 * s, 2 * s, s);
  const star = game.level.loot.find((l) => l.kind === 'star');
  if (star && !star.taken) {
    ctx.fillStyle = COLOURS.gem;
    ctx.fillRect(x0 + star.tx * s + 1, y0 + star.ty * s + 1, s - 1, s - 1);
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x0 + (game.thief.x / TILE) * s, y0 + (game.thief.y / TILE) * s, 2.6, 0, 7); ctx.fill();
}

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 5, 11, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, game) {
  veil(ctx, 0.62);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOURS.gem;
  ctx.font = '600 21px Georgia, serif';
  ctx.fillText('· T H E · N I G H T · O F · T H E ·', VIEW_W / 2, 218);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '700 84px Georgia, serif';
  ctx.fillText('VELVET VAULT', VIEW_W / 2, 306);
  ctx.fillStyle = '#aebadd';
  ctx.font = '400 21px Georgia, serif';
  ctx.fillText('One thief. One star. Every eye in the building.', VIEW_W / 2, 352);
  ctx.fillStyle = '#8b96bd';
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('Slip through the galleries, lift the Midnight Star from the vault, and reach the exit', VIEW_W / 2, 428);
  ctx.fillText('before the alarm fills. Guards chase what they see; cameras feed the alarm;', VIEW_W / 2, 454);
  ctx.fillText('a tossed coin buys you a turned back.', VIEW_W / 2, 480);
  ctx.fillStyle = '#e8e4da';
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('WASD / Arrows — move      Shift — sneak      Click — throw a coin      M — mute', VIEW_W / 2, 536);
  ctx.fillStyle = COLOURS.gold;
  ctx.font = '700 20px system-ui, sans-serif';
  const blink = Math.sin(game.time * 3) > -0.3;
  if (blink) ctx.fillText('CLICK OR PRESS ENTER TO BEGIN THE HEIST', VIEW_W / 2, 596);
}

function drawEnd(ctx, game) {
  veil(ctx, 0.66);
  ctx.textAlign = 'center';
  if (game.state === 'won') {
    ctx.fillStyle = COLOURS.gem;
    ctx.font = '700 62px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY', VIEW_W / 2, 268);
    ctx.fillStyle = '#dfe6ff';
    ctx.font = '400 20px system-ui, sans-serif';
    ctx.fillText(`The Midnight Star is yours, and ${game.lootTaken - 1} more piece${game.lootTaken - 1 === 1 ? '' : 's'} besides.`, VIEW_W / 2, 330);
    ctx.fillText(`Time ${Math.floor(game.elapsed / 60)}:${String(Math.floor(game.elapsed % 60)).padStart(2, '0')}   ·   Coins left ${game.coinsLeft}`, VIEW_W / 2, 366);
    ctx.fillStyle = COLOURS.gold;
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText(`SCORE ${game.score}`, VIEW_W / 2, 428);
  } else {
    ctx.fillStyle = '#ff5a3c';
    ctx.font = '700 62px Georgia, serif';
    ctx.fillText('CAUGHT', VIEW_W / 2, 268);
    ctx.fillStyle = '#dfe6ff';
    ctx.font = '400 20px system-ui, sans-serif';
    ctx.fillText(game.loseReason || 'The vault seals around you.', VIEW_W / 2, 330);
    ctx.fillText(`You lifted ${game.lootTaken} piece${game.lootTaken === 1 ? '' : 's'} before it ended.`, VIEW_W / 2, 366);
  }
  ctx.fillStyle = '#e8e4da';
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO PLAY AGAIN', VIEW_W / 2, 486);
}

export function renderGame(ctx, game) {
  drawFloor(ctx, game.level);
  drawExit(ctx, game);
  for (const item of game.level.loot) drawLoot(ctx, game, item);
  drawWalls(ctx, game.level);
  for (const cam of game.cameras) drawCamera(ctx, game, cam);
  for (const guard of game.guards) drawGuard(ctx, game, guard);
  drawCoinFx(ctx, game);
  drawThief(ctx, game);
  // Night vignette.
  const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  grad.addColorStop(0, 'rgba(2,3,8,0)');
  grad.addColorStop(1, 'rgba(2,3,8,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHud(ctx, game);
  drawMinimap(ctx, game);
  if (game.message && game.time - game.message.t < 4) {
    ctx.fillStyle = 'rgba(5,7,14,0.8)';
    const w = ctx.measureText(game.message.text).width + 36;
    ctx.fillRect((VIEW_W - w) / 2, 58, w, 34);
    ctx.fillStyle = COLOURS.gem;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message.text, VIEW_W / 2, 81);
  }
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'won' || game.state === 'lost') drawEnd(ctx, game);
}
