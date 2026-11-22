// VELVET VAULT — the security cameras.
// Each camera is bolted to a wall and sweeps its cone back and forth on a
// steady period. It has no suspicion and no legs: it just feeds the alarm
// for as long as the thief stands in its light.

import { TILE, CAMERA_SIGHT, CAMERA_HALF_ANGLE, CAMERA_SPOT_RATE, SNEAK_SIGHT_SCALE } from './config.js';
import { coneSees } from './vision.js';

export function createCamera(spec, index) {
  return {
    x: spec.tx * TILE + TILE / 2,
    y: spec.ty * TILE + TILE / 2,
    centre: spec.centre,
    swing: spec.swing,
    period: spec.period,
    phase: index * 1.7, // cameras start out of step with each other
    facing: spec.centre,
    seesThief: 0,
  };
}

export function updateCamera(level, camera, thief, time) {
  const t = (time + camera.phase) / camera.period;
  camera.facing = camera.centre + Math.sin(t * Math.PI * 2) * camera.swing;
  const sight = CAMERA_SIGHT * (thief.sneaking ? SNEAK_SIGHT_SCALE : 1);
  camera.seesThief = coneSees(level, camera, camera.facing, CAMERA_HALF_ANGLE, sight, thief);
  return camera.seesThief * CAMERA_SPOT_RATE;
}
