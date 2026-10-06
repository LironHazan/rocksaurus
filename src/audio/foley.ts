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

// ── In a shop ──────────────────────────────────────────────

/** Metal hangers sliding along a rail: a quick run of clacks. */
export function hangers(bus: AudioNode, when: number, n = 6) {
  for (let i = 0; i < n; i++) burst(bus, when + i * 0.05, 0.05, 'bandpass', 2400 + (i % 3) * 700, 0.1, 3);
}

/** A curtain pulled across: a soft swish of filtered noise. */
export function swish(bus: AudioNode, when: number, len = 0.5) {
  const src = new AudioBufferSourceNode(ctx, { buffer: noise() });
  const f = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 700, Q: 0.8 });
  f.frequency.setValueAtTime(700, when);
  f.frequency.exponentialRampToValueAtTime(2600, when + len);
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.1, when + len * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  src.connect(f).connect(g).connect(bus);
  src.start(when, (when * 3.1) % 0.5);
  src.stop(when + len + 0.05);
}

/** A puff of magic: a little rising run of bell tones. */
export function sparkle(bus: AudioNode, when: number) {
  [1318.5, 1568, 1975.5, 2349.3, 2637].forEach((f, i) => tone(bus, when + i * 0.06, 'sine', f, f, 0.5, 0.05));
  burst(bus, when, 0.25, 'highpass', 5000, 0.06);
}

/** A cash register: the bell, then the drawer popping out. */
export function kaching(bus: AudioNode, when: number) {
  tone(bus, when, 'sine', 2093, 2093, 0.9, 0.12);
  tone(bus, when, 'sine', 3136, 3136, 0.6, 0.06);
  burst(bus, when + 0.12, 0.12, 'lowpass', 900, 0.2);
  burst(bus, when + 0.14, 0.06, 'bandpass', 3500, 0.1, 2);
}

/** A receipt printer ratcheting out a long strip. */
export function printer(bus: AudioNode, when: number, len = 0.9) {
  for (let t = 0; t < len; t += 0.045) burst(bus, when + t, 0.02, 'bandpass', 2800, 0.05, 2);
}

/** A die clattering across a counter: bounces that get closer together and quieter. */
export function diceRoll(bus: AudioNode, when: number) {
  let t = 0;
  for (let i = 0; i < 9; i++) {
    burst(bus, when + t, 0.04, 'bandpass', 1800 + (i % 3) * 600, 0.2 * 0.8 ** i, 2.5);
    tone(bus, when + t, 'triangle', 900, 500, 0.05, 0.05 * 0.8 ** i);
    t += 0.19 * 0.78 ** i;
  }
}

/** Rustling paper (a shopping bag). */
export function rustle(bus: AudioNode, when: number) {
  for (let i = 0; i < 5; i++) burst(bus, when + i * 0.07, 0.07, 'bandpass', 3200 + i * 300, 0.07, 0.8);
}

/** A boot on a hard floor. */
export const footstep = (bus: AudioNode, when: number) => {
  burst(bus, when, 0.05, 'lowpass', 500, 0.14);
  burst(bus, when, 0.02, 'bandpass', 2200, 0.05, 2);
};

// ── On the pitch ───────────────────────────────────────────

/** A referee's pea whistle: a shrill tone with the pea's fast trill. */
export function whistle(bus: AudioNode, when: number, len = 0.35) {
  const o = new OscillatorNode(ctx, { type: 'sine', frequency: 2950 });
  const trill = new OscillatorNode(ctx, { frequency: 34 });
  const depth = new GainNode(ctx, { gain: 120 });
  trill.connect(depth).connect(o.frequency);
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.09, when + 0.02);
  g.gain.setTargetAtTime(0, when + len, 0.03);
  o.connect(g).connect(bus);
  for (const n of [o, trill]) {
    n.start(when);
    n.stop(when + len + 0.2);
  }
  burst(bus, when, len, 'bandpass', 3000, 0.03, 3); // breath through it
}

/** A boot on a football: a round thump with a leathery slap. */
export function kickBall(bus: AudioNode, when: number, vol = 1) {
  tone(bus, when, 'sine', 210, 70, 0.14, 0.22 * vol);
  burst(bus, when, 0.05, 'bandpass', 900, 0.18 * vol, 1.2);
}

/** A small crowd (the touchline) cheering: a swell of filtered noise that rises and fades. */
export function cheer(bus: AudioNode, when: number, len = 2.5) {
  const src = new AudioBufferSourceNode(ctx, { buffer: noise(), loop: true });
  const f = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1300, Q: 0.7 });
  const wobble = new OscillatorNode(ctx, { frequency: 3.1 });
  const wobbleDepth = new GainNode(ctx, { gain: 0.25 });
  const voices = new GainNode(ctx, { gain: 0.75 }); // the crowd's ebb and flow…
  wobble.connect(wobbleDepth).connect(voices.gain);
  const g = new GainNode(ctx, { gain: 0 }); // …under the swell
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.16, when + 0.25);
  g.gain.setTargetAtTime(0, when + len * 0.6, len * 0.2);
  src.connect(f).connect(voices).connect(g).connect(bus);
  for (const n of [src, wobble]) {
    n.start(when);
    n.stop(when + len + 0.5);
  }
}
