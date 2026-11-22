// VELVET VAULT — shared tuning constants for the whole game.
// One place for sizes, speeds and rates so the balance is easy to read.

export const TILE = 40; // pixels per map tile
export const MAP_W = 32; // tiles across  (32 * 40 = 1280)
export const MAP_H = 20; // tiles down    (20 * 40 = 800)
export const VIEW_W = MAP_W * TILE;
export const VIEW_H = MAP_H * TILE;

export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 168; // px per second, normal stride
export const THIEF_SNEAK_SPEED = 92; // px per second while sneaking (Shift)
export const SNEAK_SIGHT_SCALE = 0.7; // sneaking shrinks every observer's reach

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 74;
export const GUARD_CHASE_SPEED = 158;
export const GUARD_TURN_RATE = 3.4; // radians per second a guard can swing round

export const GUARD_SIGHT = 168; // vision cone length, px
export const GUARD_HALF_ANGLE = 0.58; // vision cone half-angle, radians (~33 deg)
export const CAMERA_SIGHT = 150;
export const CAMERA_HALF_ANGLE = 0.46;

export const ALARM_MAX = 100;
export const ALARM_DECAY = 7.5; // per second while nobody sees the thief
export const GUARD_SPOT_RATE = 30; // alarm per second from a guard at point blank
export const CAMERA_SPOT_RATE = 20; // alarm per second from a camera at point blank
export const SHOUT_ALARM = 22; // instant alarm a guard adds when he shouts

export const COIN_COUNT = 3; // distraction coins the thief carries
export const COIN_THROW_RANGE = 280; // px
export const COIN_LURE_RADIUS = 230; // guards this close turn to the noise
export const COIN_LURE_TIME = 2.6; // seconds they stare at the noise

export const STAR_SCORE = 1000;
export const LOOT_SCORE = 200;

export const COLOURS = {
  ink: '#070a14',
  wall: '#2b3350',
  wallTop: '#4a5680',
  thief: '#e8e4da',
  thiefCloak: '#232946',
  guard: '#3f6fd8',
  guardAlert: '#e2492f',
  gold: '#f4c542',
  gem: '#7ef0d4',
  exit: '#59d977',
  alarm: '#ff4747',
};
