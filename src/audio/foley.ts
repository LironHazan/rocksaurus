import { audio } from './context';

// Everyday foley: keys, a shaker, gulps, a pager, a clock, footsteps.
const { ctx } = audio;

let noiseBuf: AudioBuffer | null = null;
function noise(): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let seed = 11;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return noiseBuf;
}

function burst(bus: AudioNode, when: number, len: number, type: BiquadFilterType, freq: number, vol: number, Q = 1) {
  const src = new AudioBufferSourceNode(ctx, { buffer: noise() });
  const f = new BiquadFilterNode(ctx, { type, frequency: freq, Q });
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  src.connect(f).connect(g).connect(bus);
  src.start(when, (when * 7.3) % 0.8);
  src.stop(when + len + 0.05);
}

function tone(bus: AudioNode, when: number, type: OscillatorType, f0: number, f1: number, len: number, vol: number) {
  const o = new OscillatorNode(ctx, { type, frequency: f0 });
  o.frequency.exponentialRampToValueAtTime(f1, when + len);
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.008);
  g.gain.setTargetAtTime(0, when + len * 0.7, len * 0.15);
  o.connect(g).connect(bus);
  o.start(when);
  o.stop(when + len + 0.1);
}

/** A drumstick tapping a key. */
export const keyTap = (bus: AudioNode, when: number) => burst(bus, when, 0.03, 'bandpass', 3200, 0.12, 2);

/** One shake of the protein shaker (powder + the little whisk ball). */
export function rattle(bus: AudioNode, when: number) {
  burst(bus, when, 0.09, 'bandpass', 5200, 0.16, 1.5);
  tone(bus, when + 0.02, 'triangle', 1900, 1500, 0.05, 0.03);
}

export function gulp(bus: AudioNode, when: number) {
  tone(bus, when, 'sine', 320, 110, 0.16, 0.22);
  burst(bus, when, 0.1, 'lowpass', 700, 0.12);
}

/** The pager: three shrill beeps over a rattling buzz on the nightstand. */
export function page(bus: AudioNode, when: number) {
  for (let i = 0; i < 3; i++) tone(bus, when + i * 0.16, 'square', 2900, 2900, 0.1, 0.05);
  const buzz = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 150 });
  const lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 600 });
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.12, when + 0.02);
  g.gain.setTargetAtTime(0, when + 0.45, 0.04);
  buzz.connect(lp).connect(g).connect(bus);
  buzz.start(when);
  buzz.stop(when + 0.7);
}

/** Bedside clock tick. */
export const tick = (bus: AudioNode, when: number) => burst(bus, when, 0.02, 'highpass', 6000, 0.05);

/** A giant footstep. */
export const stomp = (bus: AudioNode, when: number) => tone(bus, when, 'sine', 110, 45, 0.3, 0.2);
