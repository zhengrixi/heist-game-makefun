// VELVET VAULT — sound, all synthesized with WebAudio, no files.
// Short bleeps only: a soft tick for footsteps is skipped, but pickups,
// shouts, the alarm's edge and the win/lose stings are all here. The context
// is created lazily on the first user gesture, as browsers require.

let ctx = null;
let muted = false;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  pickup() { tone(880, 0.09, 'triangle', 0.07); tone(1320, 0.12, 'triangle', 0.06, 0.07); },
  star() { tone(660, 0.1, 'triangle', 0.08); tone(880, 0.1, 'triangle', 0.08, 0.09); tone(1320, 0.22, 'triangle', 0.09, 0.18); },
  coin() { tone(1560, 0.06, 'square', 0.04); tone(1180, 0.1, 'square', 0.035, 0.05); },
  shout() { tone(220, 0.16, 'sawtooth', 0.09, 0, 160); tone(330, 0.12, 'sawtooth', 0.07, 0.05, 240); },
  spotted() { tone(520, 0.07, 'square', 0.045); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.11)); },
  lose() { tone(392, 0.2, 'sawtooth', 0.07, 0, 300); tone(233, 0.34, 'sawtooth', 0.08, 0.16, 155); },
};
