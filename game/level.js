// VELVET VAULT — the museum floor plan.
// The map is a grid of tiles. Walls are solid tiles; everything else is floor.
// Rooms are joined by door gaps in the dividing walls, and display cases and
// pillars inside the rooms break lines of sight, so every room has cover and
// more than one way through.

import { MAP_W, MAP_H } from './config.js';

// Wall rectangles in tile units: [x, y, w, h].
const WALL_RECTS = [
  // West wall between the West Gallery and the Central Hall, door at y=6.
  [10, 1, 1, 5], [10, 7, 1, 5],
  // East wall upper stretch, door at y=4.
  [21, 1, 1, 3], [21, 5, 1, 4],
  // East wall lower stretch, door at y=14.
  [21, 10, 1, 4], [21, 15, 1, 4],
  // Wall between the West Gallery and the Foyer, door at x=5.
  [1, 12, 4, 1], [6, 12, 4, 1],
  // Wall between the Atrium and the Central Hall, doors at x=13 and x=18.
  [11, 9, 2, 1], [14, 9, 4, 1], [19, 9, 2, 1],
  // Wall between the East Gallery and the Vault, door at x=26.
  [22, 6, 4, 1], [27, 6, 4, 1],
  // Display cases and pillars: cover inside the rooms.
  [4, 4, 2, 1], [4, 8, 2, 1], // west gallery cases
  [14, 3, 3, 1], [16, 6, 1, 2], // atrium cases
  [13, 13, 2, 1], [17, 15, 2, 1], [15, 17, 1, 1], // central hall cases
  [25, 11, 2, 1], [28, 15, 2, 1], // east gallery cases
  [24, 2, 1, 2], [29, 2, 1, 2], // vault pillars flanking the Star
];

// Floor tints per room, so the plan reads at a glance: [x, y, w, h, colour].
const ROOM_TINTS = [
  [1, 1, 9, 11, '#141a2e'], // West Gallery
  [1, 13, 9, 6, '#10182b'], // Foyer
  [11, 1, 10, 8, '#151b31'], // Atrium
  [11, 10, 10, 9, '#131a2e'], // Central Hall
  [22, 7, 9, 12, '#141a2e'], // East Gallery
  [22, 1, 9, 5, '#1a1430'], // The Vault itself, a richer dark
];

// Loot the thief can pocket. The Star is the prize the night is for.
// kind: 'painting' | 'gold' | 'vase' | 'star'. Positions are tile centres.
const LOOT = [
  { id: 'painting-sun', kind: 'painting', tx: 2, ty: 2, name: 'The Sun Eater' },
  { id: 'painting-sea', kind: 'painting', tx: 8, ty: 10, name: 'A Sea in Amber' },
  { id: 'vase-atrium', kind: 'vase', tx: 12, ty: 2, name: 'Ming Vase' },
  { id: 'gold-central', kind: 'gold', tx: 19, ty: 17, name: 'Bullion Crate' },
  { id: 'gold-east', kind: 'gold', tx: 30, ty: 18, name: 'Coin Chest' },
  { id: 'vase-east', kind: 'vase', tx: 23, ty: 8, name: 'Jade Vase' },
  { id: 'star', kind: 'star', tx: 26, ty: 2, name: 'The Midnight Star' },
];

// Guard patrol routes: loops of tile-centre waypoints.
const GUARD_ROUTES = [
  [[3, 6], [8, 6], [8, 10], [3, 10]], // West Gallery keeper
  [[12, 16], [19, 16], [19, 12], [12, 12]], // Central Hall keeper
  [[12, 4], [19, 4], [19, 5], [12, 5]], // Atrium keeper
  [[23, 17], [30, 17], [30, 9], [23, 9]], // East Gallery keeper
  [[25, 4], [28, 4], [28, 2], [25, 2]], // Vault keeper, tight loop around the Star
];

// Cameras: fixed mounts that sweep back and forth. Tile position, the centre
// angle of the sweep (radians, 0 = east, positive = clockwise/down-screen),
// and how far either side it swings.
const CAMERAS = [
  { tx: 11, ty: 1, centre: Math.PI / 2, swing: 0.85, period: 6.5 }, // Atrium, sweeps the north doors
  { tx: 20, ty: 10, centre: Math.PI, swing: 0.8, period: 7.5 }, // Central Hall west wall
  { tx: 30, ty: 1, centre: Math.PI * 0.75, swing: 0.6, period: 5.5 }, // Vault corner, over the Star
];

export function buildLevel() {
  const walls = new Set();
  const key = (x, y) => x + ',' + y;
  for (let x = 0; x < MAP_W; x++) { walls.add(key(x, 0)); walls.add(key(x, MAP_H - 1)); }
  for (let y = 0; y < MAP_H; y++) { walls.add(key(0, y)); walls.add(key(MAP_W - 1, y)); }
  for (const [x, y, w, h] of WALL_RECTS) {
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) walls.add(key(x + dx, y + dy));
  }
  // The exit is a doorway cut into the south border of the Foyer.
  const exitTiles = [{ x: 4, y: MAP_H - 1 }, { x: 5, y: MAP_H - 1 }];
  for (const t of exitTiles) walls.delete(key(t.x, t.y));

  return {
    walls,
    isWall(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
      return walls.has(key(tx, ty));
    },
    roomTints: ROOM_TINTS,
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    guardRoutes: GUARD_ROUTES,
    cameras: CAMERAS,
    start: { tx: 4, ty: 17 },
    exitTiles,
  };
}
