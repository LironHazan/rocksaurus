import { audio } from './context.js';
import { rng } from '../engine/math.js';

const { ctx } = audio;

const noise = (() => {
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0), r = rng(21);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  return b;
})();

function env(when, peak, decay, attack = 0.002) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  return g;
}

function noiseHit(bus, when, { type, freq, Q = 0.7, peak, decay }) {
  const src = ctx.createBufferSource(), f = new BiquadFilterNode(ctx, { type, frequency: freq, Q }), g = env(when, peak, decay);
  src.buffer = noise;
  src.connect(f); f.connect(g); g.connect(bus);
  src.start(when, (when * 7.3) % 1.5); src.stop(when + decay + 0.05);
}

// Six detuned square waves: the classic recipe for metallic cymbal tone.
const METAL_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];
function metal(bus, when, { base = 40, hp = 7000, peak, decay }) {
  const f = new BiquadFilterNode(ctx, { type: 'highpass', frequency: hp }), g = env(when, peak, decay);
  f.connect(g); g.connect(bus);
  for (const r of METAL_RATIOS) {
    const o = new OscillatorNode(ctx, { type: 'square', frequency: base * r });
    o.connect(f); o.start(when); o.stop(when + decay + 0.05);
  }
}

export function kick(bus, when, vel = 1) {
  const o = new OscillatorNode(ctx, { type: 'sine' }), g = env(when, 0.9 * vel, 0.4);
  o.frequency.setValueAtTime(150, when);
  o.frequency.exponentialRampToValueAtTime(45, when + 0.12);
  o.connect(g); g.connect(bus); o.start(when); o.stop(when + 0.45);
  noiseHit(bus, when, { type: 'highpass', freq: 3000, peak: 0.15 * vel, decay: 0.012 }); // beater click
}

export function snare(bus, when, vel = 1) {
  noiseHit(bus, when, { type: 'bandpass', freq: 2200, Q: 0.6, peak: 0.5 * vel, decay: 0.2 });
  const o = new OscillatorNode(ctx, { type: 'triangle' }), g = env(when, 0.3 * vel, 0.11);
  o.frequency.setValueAtTime(200, when);
  o.frequency.exponentialRampToValueAtTime(150, when + 0.1);
  o.connect(g); g.connect(bus); o.start(when); o.stop(when + 0.15);
}

export function tom(bus, when, vel = 1, pitch = 120) {
  const o = new OscillatorNode(ctx, { type: 'sine' }), g = env(when, 0.6 * vel, 0.35);
  o.frequency.setValueAtTime(pitch * 1.6, when);
  o.frequency.exponentialRampToValueAtTime(pitch, when + 0.08);
  o.connect(g); g.connect(bus); o.start(when); o.stop(when + 0.4);
  noiseHit(bus, when, { type: 'bandpass', freq: pitch * 8, peak: 0.08 * vel, decay: 0.05 });
}

export const hat = (bus, when, vel = 1, open = false) => {
  metal(bus, when, { hp: 9000, peak: 0.04 * vel, decay: open ? 0.3 : 0.04 });
  noiseHit(bus, when, { type: 'highpass', freq: 7000, peak: 0.08 * vel, decay: open ? 0.3 : 0.045 });
};

export const crash = (bus, when, vel = 1) => {
  metal(bus, when, { base: 47, hp: 4500, peak: 0.12 * vel, decay: 2.2 });
  noiseHit(bus, when, { type: 'highpass', freq: 5000, peak: 0.22 * vel, decay: 2.0 });
};

export const stickClick = (bus, when) => {
  noiseHit(bus, when, { type: 'bandpass', freq: 3000, Q: 5, peak: 0.4, decay: 0.03 });
};

const VOICES = {
  kick: (b, w, v) => kick(b, w, v),
  snare: (b, w, v) => snare(b, w, v),
  hat: (b, w, v, ch) => hat(b, w, v, ch === 'o'),
  crash: (b, w, v) => crash(b, w, v),
  tom: (b, w, v) => tom(b, w, v, 150),
  floorTom: (b, w, v) => tom(b, w, v, 95),
  click: (b, w) => stickClick(b, w),
};

/**
 * A drum part written as one string per instrument, 16 steps per bar (16th notes):
 *   'x' hit · 'X' accent · 'o' open hi-hat · '.' rest   (spaces are ignored, use them to separate bars)
 *   { bpm: 120, tracks: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' } }
 * Returns every hit as { name, time, accent } (seconds from the start), for syncing animation.
 */
export function drumHits({ bpm, tracks }) {
  const step = 60 / bpm / 4;
  const hits = [];
  for (const [name, pattern] of Object.entries(tracks)) {
    [...pattern.replace(/\s/g, '')].forEach((ch, i) => {
      if (ch !== '.') hits.push({ name, time: i * step, accent: ch === 'X', ch });
    });
  }
  return hits.sort((a, b) => a.time - b.time);
}

/** Schedules a drum part (see drumHits) on the bus starting at t0. */
export function playDrums(bus, t0, part) {
  for (const { name, time, accent, ch } of drumHits(part)) VOICES[name](bus, t0 + time, accent ? 1 : 0.75, ch);
}
