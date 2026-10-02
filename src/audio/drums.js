import { audio } from './context';
import { rng } from '../engine/math';
import { drumHits, hitVelocity } from './drum-patterns';
import { atTime } from './schedule';

const { ctx } = audio;

const noise = (() => {
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
    d = b.getChannelData(0),
    r = rng(21);
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
  const src = ctx.createBufferSource(),
    f = new BiquadFilterNode(ctx, { type, frequency: freq, Q }),
    g = env(when, peak, decay);
  src.buffer = noise;
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(when, (when * 7.3) % 1.5);
  src.stop(when + decay + 0.05);
}

// Six detuned square waves: the classic recipe for metallic cymbal tone.
const METAL_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];
function metal(bus, when, { base = 40, hp = 7000, peak, decay }) {
  const f = new BiquadFilterNode(ctx, { type: 'highpass', frequency: hp }),
    g = env(when, peak, decay);
  f.connect(g);
  g.connect(bus);
  for (const r of METAL_RATIOS) {
    const o = new OscillatorNode(ctx, { type: 'square', frequency: base * r });
    o.connect(f);
    o.start(when);
    o.stop(when + decay + 0.05);
  }
}

// A struck drumhead rings at several inharmonic frequencies at once (circular-membrane modes), each dying
// away at its own rate, with only a tiny pitch dip on the attack. Layering these — instead of one sine
// sliding down in pitch, the classic 80s drum-machine sound — is what makes drums sound acoustic.
const MEMBRANE_MODES = [
  [1, 1, 1],
  [1.59, 0.45, 0.6],
  [2.14, 0.3, 0.45],
  [2.3, 0.22, 0.4],
  [2.65, 0.16, 0.3],
]; // [frequency ratio, level, decay ratio]

function membrane(
  bus,
  when,
  f0,
  { vel = 1, decay = 0.4, level = 0.5, modes = MEMBRANE_MODES.length, dip = 1.04 } = {},
) {
  for (const [ratio, amp, d] of MEMBRANE_MODES.slice(0, modes)) {
    const f = f0 * ratio;
    const o = new OscillatorNode(ctx, { type: 'sine' });
    o.frequency.setValueAtTime(f * dip, when); // the head is tighter for an instant when struck
    o.frequency.exponentialRampToValueAtTime(f, when + 0.04);
    const g = env(when, level * amp * vel, decay * d, 0.001);
    o.connect(g);
    g.connect(bus);
    o.start(when);
    o.stop(when + decay * d + 0.05);
  }
}

export function kick(bus, when, vel = 1) {
  membrane(bus, when, 60, { vel, decay: 0.26, level: 0.85, modes: 3, dip: 1.45 }); // tight, punchy thump
  noiseHit(bus, when, { type: 'lowpass', freq: 180, Q: 0.7, peak: 0.3 * vel, decay: 0.06 }); // air push from the head
  noiseHit(bus, when, { type: 'bandpass', freq: 4200, Q: 1.4, peak: 0.28 * vel, decay: 0.014 }); // hard beater click (cuts through)
}

export function snare(bus, when, vel = 1) {
  membrane(bus, when, 195, { vel, decay: 0.18, level: 0.38, modes: 3 }); // drum body
  if (vel > 0.5) noiseHit(bus, when, { type: 'bandpass', freq: 920, Q: 9, peak: 0.16 * vel, decay: 0.06 }); // rimshot ring
  noiseHit(bus, when, { type: 'bandpass', freq: 4200, Q: 0.5, peak: 0.32 * vel, decay: 0.24 }); // snare wires
  noiseHit(bus, when, { type: 'highpass', freq: 1500, Q: 0.7, peak: 0.18 * vel, decay: 0.12 });
  noiseHit(bus, when, { type: 'bandpass', freq: 2500, Q: 2, peak: 0.18 * vel, decay: 0.015 }); // stick crack
}

export function tom(bus, when, vel = 1, pitch = 120) {
  membrane(bus, when, pitch, { vel, decay: 0.5, level: 0.45, modes: 4 }); // ringing head
  noiseHit(bus, when, { type: 'lowpass', freq: pitch * 5, Q: 0.8, peak: 0.12 * vel, decay: 0.12 }); // shell
  noiseHit(bus, when, { type: 'bandpass', freq: 3000, Q: 1, peak: 0.1 * vel, decay: 0.02 }); // stick
}

export const hat = (bus, when, vel = 1, open = false) => {
  metal(bus, when, { hp: 9000, peak: 0.04 * vel, decay: open ? 0.3 : 0.04 });
  noiseHit(bus, when, { type: 'highpass', freq: 7000, peak: 0.08 * vel, decay: open ? 0.3 : 0.045 });
};

export const crash = (bus, when, vel = 1) => {
  metal(bus, when, { base: 47, hp: 4500, peak: 0.12 * vel, decay: 2.2 });
  noiseHit(bus, when, { type: 'highpass', freq: 5000, peak: 0.22 * vel, decay: 2.0 });
};

/** Trashy china: dark, gritty metal with a fast bloom — the big-accent cymbal. */
export const china = (bus, when, vel = 1) => {
  metal(bus, when, { base: 61, hp: 2600, peak: 0.13 * vel, decay: 1.4 });
  noiseHit(bus, when, { type: 'bandpass', freq: 5200, Q: 0.8, peak: 0.26 * vel, decay: 1.1 });
};

/** Splash: small, bright, gone quickly. */
export const splash = (bus, when, vel = 1) => {
  metal(bus, when, { base: 70, hp: 6000, peak: 0.09 * vel, decay: 0.55 });
  noiseHit(bus, when, { type: 'highpass', freq: 7000, peak: 0.2 * vel, decay: 0.45 });
};

/** Ride: a defined 'ping' with a little wash. */
export const ride = (bus, when, vel = 1) => {
  metal(bus, when, { base: 52, hp: 5500, peak: 0.05 * vel, decay: 0.8 });
  const o = new OscillatorNode(ctx, { type: 'sine', frequency: 2650 }),
    g = env(when, 0.035 * vel, 0.6);
  o.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + 0.65);
};

export const stickClick = (bus, when) => {
  noiseHit(bus, when, { type: 'bandpass', freq: 3000, Q: 5, peak: 0.4, decay: 0.03 });
};

const VOICES = {
  kick: (b, w, v) => kick(b, w, v),
  snare: (b, w, v) => snare(b, w, v),
  hat: (b, w, v, ch) => hat(b, w, v, ch === 'o'),
  crash: (b, w, v) => crash(b, w, v),
  china: (b, w, v) => china(b, w, v),
  splash: (b, w, v) => splash(b, w, v),
  ride: (b, w, v) => ride(b, w, v),
  tom: (b, w, v) => tom(b, w, v, 150),
  floorTom: (b, w, v) => tom(b, w, v, 95),
  click: (b, w) => stickClick(b, w),
};

export { drumHits } from './drum-patterns';

/**
 * The drum bus: a touch of saturation, fast punchy compression and a presence lift — the edge that makes
 * acoustic drums sound aggressive and in-your-face in a rock mix.
 */
function drumBus(bus) {
  const drive = new GainNode(ctx, { gain: 1.4 });
  const sat = new WaveShaperNode(ctx, { curve: softCurve(1.3), oversample: '2x' });
  const comp = new DynamicsCompressorNode(ctx, { threshold: -20, knee: 6, ratio: 4.5, attack: 0.004, release: 0.12 });
  const presence = new BiquadFilterNode(ctx, { type: 'highshelf', frequency: 4500, gain: 3 });
  const level = new GainNode(ctx, { gain: 0.9 });
  drive.connect(sat).connect(comp).connect(presence).connect(level).connect(bus);
  return drive;
}
function softCurve(k, n = 1024) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return c;
}

/** Schedules a drum part (see drumHits) through the drum bus, starting at t0. */
export function playDrums(bus, t0, part) {
  const kit = drumBus(bus);
  for (const { name, time, ch } of drumHits(part))
    atTime(t0 + time, () => VOICES[name](kit, t0 + time, hitVelocity(ch), ch));
}
