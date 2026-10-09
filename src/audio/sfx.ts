import { audio } from './context';

const { ctx } = audio;

/** Soft pitched sine that slides f0 → f1. Good for hops, pops, landings. */
export function boop(bus: AudioNode, when: number, f0: number, f1: number, len = 0.12, vol = 0.07) {
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.frequency.setValueAtTime(f0, when);
  o.frequency.exponentialRampToValueAtTime(f1, when + len);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  o.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + len + 0.05);
}

export const hop = (bus: AudioNode, when: number) => boop(bus, when, 520, 300, 0.12, 0.07);
export const thump = (bus: AudioNode, when: number) => boop(bus, when, 140, 60, 0.25, 0.18);

/** A chat message arriving on the phone in your paw. */
export const chatPop = (bus: AudioNode, when: number) => boop(bus, when, 620, 980, 0.09, 0.08);

/** Your own chat message going out: higher and shorter than a pop. */
export const chatSent = (bus: AudioNode, when: number) => boop(bus, when, 900, 1300, 0.07, 0.06);

const noise = (() => {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate),
    d = b.getChannelData(0);
  let seed = 9;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return b;
})();

interface Burst {
  type?: BiquadFilterType;
  freq?: number;
  Q?: number;
  vol?: number;
  attack?: number;
}
function noiseBurst(
  bus: AudioNode,
  when: number,
  len: number,
  { type = 'bandpass', freq = 1000, Q = 1, vol = 0.3, attack = 0.005 }: Burst = {},
) {
  const src = ctx.createBufferSource(),
    f = new BiquadFilterNode(ctx, { type, frequency: freq, Q }),
    g = ctx.createGain();
  src.buffer = noise;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(when, Math.random() * 0.5);
  src.stop(when + len + 0.05);
}

export const sniff = (bus: AudioNode, when: number) =>
  noiseBurst(bus, when, 0.16, { type: 'highpass', freq: 2500, vol: 0.12, attack: 0.08 });

/** Bright bell for "ta-da" and "idea!" moments. */
export function ding(bus: AudioNode, when: number, f = 1318.5) {
  (
    [
      [1, 0.25],
      [2.01, 0.08],
      [3.0, 0.04],
    ] as const
  ).forEach(([m, vol]) => {
    const o = new OscillatorNode(ctx, { frequency: f * m }),
      g = ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o.connect(g);
    g.connect(bus);
    o.start(when);
    o.stop(when + 1.5);
  });
}

export function chomp(bus: AudioNode, when: number) {
  noiseBurst(bus, when, 0.07, { freq: 1300, Q: 2, vol: 0.5 });
  boop(bus, when, 240, 110, 0.09, 0.2);
}

/** Effortful stretch: rising, wobbly tone. */
export function stretch(bus: AudioNode, when: number, len = 1.2) {
  const o = new OscillatorNode(ctx, { type: 'triangle' }),
    g = ctx.createGain();
  const lfo = new OscillatorNode(ctx, { frequency: 14 }),
    depth = new GainNode(ctx, { gain: 18 });
  o.frequency.setValueAtTime(260, when);
  o.frequency.exponentialRampToValueAtTime(620, when + len);
  lfo.connect(depth);
  depth.connect(o.frequency);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.06, when + 0.1);
  g.gain.setTargetAtTime(0, when + len - 0.15, 0.05);
  o.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + len + 0.3);
  lfo.start(when);
  lfo.stop(when + len + 0.3);
}

export function burp(bus: AudioNode, when: number) {
  const o = new OscillatorNode(ctx, { type: 'sawtooth' }),
    lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 520, Q: 3 });
  const g = ctx.createGain(),
    lfo = new OscillatorNode(ctx, { frequency: 28 }),
    depth = new GainNode(ctx, { gain: 10 });
  o.frequency.setValueAtTime(130, when);
  o.frequency.exponentialRampToValueAtTime(85, when + 0.45);
  lfo.connect(depth);
  depth.connect(o.frequency);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.25, when + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  o.connect(lp);
  lp.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + 0.55);
  lfo.start(when);
  lfo.stop(when + 0.55);
}
