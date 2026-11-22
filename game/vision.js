// VELVET VAULT — vision cones and line of sight.
// A cone is an origin, a facing angle, a half-angle and a reach. A point is
// seen when it is inside the cone and no wall tile blocks the straight line
// between the eye and the point.

import { TILE } from './config.js';

export function tileOf(px) {
  return Math.floor(px / TILE);
}

// March along the segment in small steps; blocked if any step lands in a wall.
export function lineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (level.isWall(tileOf(x0 + dx * t), tileOf(y0 + dy * t))) return false;
  }
  return true;
}

export function angleTo(x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Returns 0 when the target is not seen, else a strength in (0, 1]:
// stronger the nearer the target and the nearer the cone's centre line.
export function coneSees(level, eye, facing, halfAngle, reach, target) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > reach || dist < 1) return 0;
  const off = Math.abs(angleDiff(Math.atan2(dy, dx), facing));
  if (off > halfAngle) return 0;
  if (!lineOfSight(level, eye.x, eye.y, target.x, target.y)) return 0;
  const near = 1 - dist / reach; // 0 at the rim, 1 at the eye
  const centre = 1 - off / halfAngle; // 0 at the edge, 1 dead centre
  return 0.25 + 0.75 * Math.min(1, near * 0.7 + centre * 0.55);
}

// The polygon a cone covers, clipped by walls: cast a fan of rays and stop
// each at the first wall. Used for drawing, so the lit area hugs the rooms.
export function conePolygon(level, eye, facing, halfAngle, reach) {
  const rays = 26;
  const points = [{ x: eye.x, y: eye.y }];
  for (let i = 0; i <= rays; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const step = 9;
    let d = 0;
    let x = eye.x;
    let y = eye.y;
    while (d < reach) {
      d += step;
      x = eye.x + Math.cos(a) * d;
      y = eye.y + Math.sin(a) * d;
      if (level.isWall(tileOf(x), tileOf(y))) break;
    }
    points.push({ x, y });
  }
  return points;
}
