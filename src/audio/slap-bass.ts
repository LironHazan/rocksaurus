import { audio } from './context';
import { midi, type Note } from './notes';
import { pluck } from './guitar';

// Slap bass and mouth pops: a sitcom-funk rhythm section.
const { ctx } = audio;

/** slap = thumb on a low string, pop = finger snapping a high string, ghost = a muted, barely-there note. */
export type SlapKind = 'slap' | 'pop' | 'ghost';

let clickBuf: AudioBuffer | null = null;
function click(): AudioBuffer {
  if (clickBuf) return clickBuf;
  clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
  const d = clickBuf.getChannelData(0);
  let seed = 77;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / d.length);
  }
  return clickBuf;
}

/** The slap bass amp: round lows, slightly scooped mids, a soft top (no metallic zing), gently compressed. */
export function slapAmp(bus: AudioNode): AudioNode {
  const chain: AudioNode[] = [
    new BiquadFilterNode(ctx, { type: 'highpass', frequency: 35 }),
    new BiquadFilterNode(ctx, { type: 'lowshelf', frequency: 100, gain: 4 }),
    new BiquadFilterNode(ctx, { type: 'peaking', frequency: 500, Q: 0.8, gain: -3 }),
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 2600, Q: 0.5 }),
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 4200, Q: 0.5 }), // steep roll-off: warm, not tinny
    new DynamicsCompressorNode(ctx, { threshold: -16, knee: 6, ratio: 4, attack: 0.004, release: 0.12 }),
    new GainNode(ctx, { gain: 1.0 }),
  ];
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  return chain[0]!;
}

/** One slapped, popped or ghosted bass note into a slapAmp(). */
export function slap(amp: AudioNode, when: number, note: Note, kind: SlapKind = 'slap', dur = 0.2): void {
  const m = midi(note);
  const f = 440 * 2 ** ((m - 69) / 12);
  const bright = kind === 'pop' ? 0.55 : kind === 'slap' ? 0.42 : 0.2;
  const vel = kind === 'ghost' ? 0.25 : 0.8;
  const src = new AudioBufferSourceNode(ctx, {
    buffer: pluck(f, { dur: 1.2, rho: 0.993, bright, seed: 11 + (m % 7) }),
  });
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(vel, when);
  g.gain.setTargetAtTime(0, when + dur, kind === 'ghost' ? 0.01 : 0.035); // fretting hand lets go
  src.connect(g).connect(amp);
  src.start(when);
  src.stop(when + dur + 0.25);

  // round body: a pure tone at the fundamental under the string, so it thumps instead of twangs
  const body = new OscillatorNode(ctx, { type: 'sine', frequency: f });
  const bg = new GainNode(ctx, { gain: 0 });
  bg.gain.setValueAtTime(0, when);
  bg.gain.linearRampToValueAtTime(0.45 * vel, when + 0.006);
  bg.gain.setTargetAtTime(0.25 * vel, when + 0.006, 0.12);
  bg.gain.setTargetAtTime(0, when + dur, 0.035);
  body.connect(bg).connect(amp);
  body.start(when);
  body.stop(when + dur + 0.25);
  if (kind === 'ghost') return;

  // the slap/pop itself: a dull, short thud of thumb (or finger) on the string, not a bright click
  const c = new AudioBufferSourceNode(ctx, { buffer: click() });
  const bp = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: kind === 'pop' ? 1400 : 700, Q: 0.9 });
  const cg = new GainNode(ctx, { gain: 0.16 * vel });
  c.connect(bp).connect(cg).connect(amp);
  c.start(when);
}

/** A mouth pop (finger flicked out of a puffed cheek): a quick pitch drop with a little air. */
export function mouthPop(bus: AudioNode, when: number, vol = 0.22): void {
  const o = new OscillatorNode(ctx, { type: 'sine', frequency: 750 });
  o.frequency.exponentialRampToValueAtTime(170, when + 0.04);
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
  o.connect(g).connect(bus);
  o.start(when);
  o.stop(when + 0.1);
}
