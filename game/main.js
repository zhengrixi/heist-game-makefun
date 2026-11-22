// VELVET VAULT — the night itself: game state, the loop, and the rules.
// One thief, five guards, three cameras, one alarm. Lift the Midnight Star
// from the vault and reach the EXIT in the foyer; side loot is score, and a
// tossed coin (you carry three) turns a guard's back for a few seconds.

import {
  TILE, THIEF_RADIUS, THIEF_SPEED, THIEF_SNEAK_SPEED, COIN_COUNT,
  COIN_THROW_RANGE, STAR_SCORE, LOOT_SCORE,
} from './config.js';
import { buildLevel } from './level.js';
import { createAlarm } from './alarm.js';
import { createGuard, updateGuard, lureGuards, guardFeedRate, hitsWall } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createInput } from './input.js';
import { renderGame } from './render.js';
import { applyShot } from './shots.js';
import { initAudio, toggleMute, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

export function createGame() {
  const level = buildLevel();
  return {
    level,
    thief: {
      x: level.start.tx * TILE + TILE / 2,
      y: level.start.ty * TILE + TILE / 2,
      radius: THIEF_RADIUS,
      facing: -Math.PI / 2,
      sneaking: false,
      hasStar: false,
    },
    guards: level.guardRoutes.map((r) => createGuard(r)),
    cameras: level.cameras.map((c, i) => createCamera(c, i)),
    alarm: createAlarm(),
    state: 'title', // 'title' | 'playing' | 'won' | 'lost'
    time: 0,
    elapsed: 0,
    score: 0,
    coinsLeft: COIN_COUNT,
    lootTaken: 0,
    coinFx: [],
    message: null,
    loseReason: '',
    wasSeen: false,
  };
}

let game = createGame();

function startRun() {
  const fresh = createGame();
  fresh.state = 'playing';
  game = fresh;
}

function moveThief(dt) {
  const t = game.thief;
  let dx = 0, dy = 0;
  if (input.held('w', 'arrowup')) dy -= 1;
  if (input.held('s', 'arrowdown')) dy += 1;
  if (input.held('a', 'arrowleft')) dx -= 1;
  if (input.held('d', 'arrowright')) dx += 1;
  t.sneaking = input.held('shift');
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = t.sneaking ? THIEF_SNEAK_SPEED : THIEF_SPEED;
  const nx = t.x + (dx / len) * speed * dt;
  const ny = t.y + (dy / len) * speed * dt;
  if (!hitsWall(game.level, nx, ny, t.radius)) { t.x = nx; t.y = ny; }
  else if (!hitsWall(game.level, nx, t.y, t.radius)) { t.x = nx; }
  else if (!hitsWall(game.level, t.x, ny, t.radius)) { t.y = ny; }
  t.facing = Math.atan2(dy, dx);
}

function collectLoot() {
  const t = game.thief;
  for (const item of game.level.loot) {
    if (item.taken) continue;
    const ix = item.tx * TILE + TILE / 2, iy = item.ty * TILE + TILE / 2;
    if (Math.hypot(t.x - ix, t.y - iy) < 26) {
      item.taken = true;
      game.lootTaken++;
      if (item.kind === 'star') {
        t.hasStar = true;
        game.score += STAR_SCORE;
        game.message = { text: 'THE MIDNIGHT STAR IS YOURS — REACH THE EXIT!', t: game.time };
        sfx.star();
      } else {
        game.score += LOOT_SCORE;
        game.message = { text: `${item.name} lifted  +${LOOT_SCORE}`, t: game.time };
        sfx.pickup();
      }
    }
  }
}

function checkExit() {
  const t = game.thief;
  if (!t.hasStar) return;
  const tx = Math.floor(t.x / TILE), ty = Math.floor(t.y / TILE);
  if (game.level.exitTiles.some((e) => e.x === tx && e.y === ty)) {
    const timeBonus = Math.max(0, Math.round(600 - game.elapsed * 2));
    game.score += timeBonus + game.coinsLeft * 50;
    game.state = 'won';
    sfx.win();
  }
}

function throwCoin(x, y) {
  const t = game.thief;
  if (game.coinsLeft <= 0) return;
  if (Math.hypot(x - t.x, y - t.y) > COIN_THROW_RANGE) return;
  if (game.level.isWall(Math.floor(x / TILE), Math.floor(y / TILE))) return;
  game.coinsLeft--;
  game.coinFx.push({ x, y, t: game.time });
  lureGuards(game.guards, { x, y });
  sfx.coin();
}

function update(dt) {
  game.time += dt;
  if (game.state !== 'playing') return;
  game.elapsed += dt;
  moveThief(dt);
  collectLoot();
  checkExit();
  if (game.state !== 'playing') return;

  let feed = 0;
  for (const cam of game.cameras) feed += updateCamera(game.level, cam, game.thief, game.time);
  let caught = false;
  for (const guard of game.guards) {
    const ev = updateGuard(game.level, guard, game.thief, game.alarm, dt, () => game.alarm.shout());
    feed += guardFeedRate(guard);
    if (ev.shouted) sfx.shout();
    if (ev.caught) caught = true;
  }
  if (caught) {
    game.state = 'lost';
    game.loseReason = 'A guard’s hand closes on your shoulder.';
    sfx.lose();
    return;
  }
  if (game.alarm.update(dt, feed)) {
    game.state = 'lost';
    game.loseReason = 'The alarm hit the top and the vault sealed.';
    sfx.lose();
    return;
  }
  if (game.alarm.seenNow && !game.wasSeen) sfx.spotted();
  game.wasSeen = game.alarm.seenNow;
}

function handleClicks() {
  for (const click of input.takeClicks()) {
    initAudio();
    if (game.state === 'title' || game.state === 'won' || game.state === 'lost') startRun();
    else throwCoin(click.x, click.y);
  }
  if (input.anyKey) {
    initAudio();
    if ((game.state === 'title' || game.state === 'won' || game.state === 'lost') && input.held('enter')) startRun();
    input.anyKey = false;
  }
  if (input.keys.has('m')) { toggleMute(); input.keys.delete('m'); }
}

// Screenshot mode (?shot=heist etc.): pose the scene and hold it still.
const shotName = new URLSearchParams(location.search).get('shot');
const shotMode = Boolean(shotName);
if (shotMode) applyShot(game, shotName);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!shotMode) {
    handleClicks();
    update(dt);
  } else {
    game.time += dt; // the gem still glitters in a held pose
  }
  renderGame(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// For local play-testing only: a handle the headless browser can drive.
window.__velvetVault = { get game() { return game; }, startRun };
