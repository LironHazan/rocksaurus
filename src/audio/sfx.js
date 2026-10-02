import { audio } from './context.js';

const { ctx } = audio;

/** Soft pitched sine that slides f0 → f1. Good for hops, pops, landings. */
export function boop(bus, when, f0, f1, len = 0.12, vol = 0.07) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(f0, when);
  o.frequency.exponentialRampToValueAtTime(f1, when + len);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  o.connect(g); g.connect(bus);
  o.start(when); o.stop(when + len + 0.05);
}

export const hop = (bus, when) => boop(bus, when, 520, 300, 0.12, 0.07);
export const thump = (bus, when) => boop(bus, when, 140, 60, 0.25, 0.18);

const noise = (() => {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
  let seed = 9;
  for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
  return b;
})();

function noiseBurst(bus, when, len, { type = 'bandpass', freq = 1000, Q = 1, vol = 0.3, attack = 0.005 } = {}) {
  const src = ctx.createBufferSource(), f = new BiquadFilterNode(ctx, { type, frequency: freq, Q }), g = ctx.createGain();
  src.buffer = noise;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  src.connect(f); f.connect(g); g.connect(bus);
  src.start(when, Math.random() * 0.5); src.stop(when + len + 0.05);
}

/** Rumbly tummy: wobbling low noise + a sliding sub tone. */
export function growl(bus, when, len = 1) {
  const src = ctx.createBufferSource(), lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 220, Q: 4 });
  const g = ctx.createGain(), lfo = new OscillatorNode(ctx, { frequency: 9 }), depth = new GainNode(ctx, { gain: 0.35 });
  src.buffer = noise; src.loop = true;
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.5, when + 0.1);
  g.gain.setTargetAtTime(0, when + len - 0.3, 0.1);
  lfo.connect(depth); depth.connect(g.gain);
  src.connect(lp); lp.connect(g); g.connect(bus);
  src.start(when); src.stop(when + len + 0.3); lfo.start(when); lfo.stop(when + len + 0.3);
  boop(bus, when, 90, 50, len, 0.25);
}

export const sniff = (bus, when) => noiseBurst(bus, when, 0.16, { type: 'highpass', freq: 2500, vol: 0.12, attack: 0.08 });

/** Bright bell for "ta-da" and "idea!" moments. */
export function ding(bus, when, f = 1318.5) {
  [[1, 0.25], [2.01, 0.08], [3.0, 0.04]].forEach(([m, vol]) => {
    const o = new OscillatorNode(ctx, { frequency: f * m }), g = ctx.createGain();
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o.connect(g); g.connect(bus); o.start(when); o.stop(when + 1.5);
  });
}

export function chomp(bus, when) {
  noiseBurst(bus, when, 0.07, { freq: 1300, Q: 2, vol: 0.5 });
  boop(bus, when, 240, 110, 0.09, 0.2);
}

/** Effortful stretch: rising, wobbly tone. */
export function stretch(bus, when, len = 1.2) {
  const o = new OscillatorNode(ctx, { type: 'triangle' }), g = ctx.createGain();
  const lfo = new OscillatorNode(ctx, { frequency: 14 }), depth = new GainNode(ctx, { gain: 18 });
  o.frequency.setValueAtTime(260, when); o.frequency.exponentialRampToValueAtTime(620, when + len);
  lfo.connect(depth); depth.connect(o.frequency);
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.06, when + 0.1);
  g.gain.setTargetAtTime(0, when + len - 0.15, 0.05);
  o.connect(g); g.connect(bus);
  o.start(when); o.stop(when + len + 0.3); lfo.start(when); lfo.stop(when + len + 0.3);
}

export function burp(bus, when) {
  const o = new OscillatorNode(ctx, { type: 'sawtooth' }), lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 520, Q: 3 });
  const g = ctx.createGain(), lfo = new OscillatorNode(ctx, { frequency: 28 }), depth = new GainNode(ctx, { gain: 10 });
  o.frequency.setValueAtTime(130, when); o.frequency.exponentialRampToValueAtTime(85, when + 0.45);
  lfo.connect(depth); depth.connect(o.frequency);
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.25, when + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  o.connect(lp); lp.connect(g); g.connect(bus);
  o.start(when); o.stop(when + 0.55); lfo.start(when); lfo.stop(when + 0.55);
}
