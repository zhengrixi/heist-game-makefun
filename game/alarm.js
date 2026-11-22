// VELVET VAULT — the alarm meter.
// Every eye that sees the thief feeds the one alarm. It climbs fast at close
// range, decays while the thief is unseen, and at the top the night is over:
// the vault seals and the thief is caught.

import { ALARM_MAX, ALARM_DECAY, SHOUT_ALARM } from './config.js';

export function createAlarm() {
  return {
    level: 0, // 0..ALARM_MAX
    seenNow: false, // any eye on the thief this frame
    update(dt, feedRate) {
      this.seenNow = feedRate > 0;
      if (feedRate > 0) {
        this.level = Math.min(ALARM_MAX, this.level + feedRate * dt);
      } else {
        this.level = Math.max(0, this.level - ALARM_DECAY * dt);
      }
      return this.level >= ALARM_MAX;
    },
    shout() {
      this.level = Math.min(ALARM_MAX, this.level + SHOUT_ALARM);
    },
    // 'calm' | 'warm' | 'hot' — drives guard speed and the HUD colour.
    get heat() {
      if (this.level >= 66) return 'hot';
      if (this.level >= 33) return 'warm';
      return 'calm';
    },
  };
}
