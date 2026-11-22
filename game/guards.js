// VELVET VAULT — the guards.
// Each guard walks a patrol loop of waypoints, sweeping his torch cone as he
// goes. He has a personal suspicion meter: it fills while the thief is in his
// cone and drains while she is not. Full suspicion means a shout (a chunk of
// alarm at once) and a chase; if he lays a hand on the thief, she is caught.
// A coin clinking on the floor pulls his eyes and feet to the noise instead.

import {
  TILE, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_TURN_RATE,
  GUARD_SIGHT, GUARD_HALF_ANGLE, GUARD_SPOT_RATE, COIN_LURE_RADIUS, SNEAK_SIGHT_SCALE,
} from './config.js';
import { coneSees, angleTo, angleDiff } from './vision.js';

let nextId = 1;

export function createGuard(route) {
  const start = route[0];
  return {
    id: nextId++,
    x: start[0] * TILE + TILE / 2,
    y: start[1] * TILE + TILE / 2,
    radius: GUARD_RADIUS,
    facing: 0,
    route,
    wp: 1 % route.length,
    suspicion: 0, // 0..1
    mode: 'patrol', // 'patrol' | 'chase' | 'lured' | 'return'
    chaseTime: 0,
    lure: null, // {x, y, t} a noise to stare at
    seesThief: 0, // strength of this guard's view of the thief, this frame
  };
}

function turnToward(guard, want, dt) {
  const d = angleDiff(want, guard.facing);
  const maxTurn = GUARD_TURN_RATE * dt;
  guard.facing += Math.max(-maxTurn, Math.min(maxTurn, d));
  return Math.abs(d) < 0.05;
}

function moveToward(level, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Slide along walls: try the full step, then each axis alone.
  if (!hitsWall(level, nx, ny, guard.radius)) { guard.x = nx; guard.y = ny; }
  else if (!hitsWall(level, nx, guard.y, guard.radius)) { guard.x = nx; }
  else if (!hitsWall(level, guard.x, ny, guard.radius)) { guard.y = ny; }
  return dist <= step + 2;
}

export function hitsWall(level, x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
    if (level.isWall(tx, ty)) return true;
  }
  return false;
}

// One frame of one guard. Returns events: {shouted, caught}.
export function updateGuard(level, guard, thief, alarm, dt, onShout) {
  const events = { shouted: false, caught: false };
  const sight = GUARD_SIGHT * (thief.sneaking ? SNEAK_SIGHT_SCALE : 1);
  guard.seesThief = coneSees(level, guard, guard.facing, GUARD_HALF_ANGLE, sight, thief);

  // Suspicion: fills in about a second of clear view, drains slower.
  if (guard.seesThief > 0) guard.suspicion = Math.min(1, guard.suspicion + guard.seesThief * dt * 1.15);
  else guard.suspicion = Math.max(0, guard.suspicion - dt * 0.35);

  if (guard.mode !== 'chase' && guard.suspicion >= 1) {
    guard.mode = 'chase';
    guard.chaseTime = 4;
    events.shouted = true;
    onShout();
  }

  const speedScale = alarm.heat === 'hot' ? 1.3 : alarm.heat === 'warm' ? 1.15 : 1;

  if (guard.mode === 'chase') {
    guard.chaseTime -= dt;
    turnToward(guard, angleTo(guard.x, guard.y, thief.x, thief.y), dt);
    moveToward(level, guard, thief.x, thief.y, GUARD_CHASE_SPEED * speedScale, dt);
    if (guard.chaseTime <= 0 && guard.seesThief === 0) { guard.mode = 'return'; guard.suspicion = 0.4; }
    if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < guard.radius + thief.radius - 4) events.caught = true;
  } else if (guard.mode === 'lured' && guard.lure) {
    guard.lure.t -= dt;
    turnToward(guard, angleTo(guard.x, guard.y, guard.lure.x, guard.lure.y), dt);
    if (Math.hypot(guard.lure.x - guard.x, guard.lure.y - guard.y) > 46) {
      moveToward(level, guard, guard.lure.x, guard.lure.y, GUARD_PATROL_SPEED * 1.25, dt);
    }
    if (guard.lure.t <= 0) { guard.mode = 'return'; guard.lure = null; }
  } else if (guard.mode === 'return') {
    const [tx, ty] = guard.route[guard.wp];
    const px = tx * TILE + TILE / 2, py = ty * TILE + TILE / 2;
    turnToward(guard, angleTo(guard.x, guard.y, px, py), dt);
    if (moveToward(level, guard, px, py, GUARD_PATROL_SPEED * 1.1, dt)) guard.mode = 'patrol';
  } else {
    // Patrol: walk the loop, facing the way he walks.
    const [tx, ty] = guard.route[guard.wp];
    const px = tx * TILE + TILE / 2, py = ty * TILE + TILE / 2;
    turnToward(guard, angleTo(guard.x, guard.y, px, py), dt);
    if (moveToward(level, guard, px, py, GUARD_PATROL_SPEED * speedScale, dt)) {
      guard.wp = (guard.wp + 1) % guard.route.length;
    }
    // A suspicious guard turns toward the glimpse.
    if (guard.suspicion > 0.25 && guard.seesThief > 0) {
      turnToward(guard, angleTo(guard.x, guard.y, thief.x, thief.y), dt);
    }
  }
  return events;
}

// A coin lands: every guard close enough drops his route and goes to look.
export function lureGuards(guards, coin) {
  for (const g of guards) {
    if (g.mode === 'chase') continue;
    if (Math.hypot(g.x - coin.x, g.y - coin.y) < COIN_LURE_RADIUS) {
      g.mode = 'lured';
      g.lure = { x: coin.x, y: coin.y, t: 2.6 };
    }
  }
}

export function guardFeedRate(guard) {
  return guard.seesThief * GUARD_SPOT_RATE * (guard.mode === 'chase' ? 1.6 : 1);
}
