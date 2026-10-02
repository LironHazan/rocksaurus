import { audio } from './context';
import { midi } from './piano';
import { pluck } from './guitar';
import { atTime } from './schedule';

const { ctx } = audio;

/** Warm bass amp: low-end boost, gentle drive for growl, then a darker cab. */
function createBassAmp(bus) {
  const chain = [
    new BiquadFilterNode(ctx, { type: 'highpass', frequency: 35 }),
    new BiquadFilterNode(ctx, { type: 'lowshelf', frequency: 120, gain: 4 }),
    new GainNode(ctx, { gain: 1.4 }),
    new WaveShaperNode(ctx, { curve: softClip(1.1), oversample: '4x' }), // just a touch of warmth
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 900, Q: 0.5 }), // dark, round tone…
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1400, Q: 0.5 }), // …with a steep roll-off (no zing)
    new GainNode(ctx, { gain: 0.55 }),
  ];
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  return chain[0];
}
function softClip(k, n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return c;
}

/**
 * Finger-style bass line, one note at a time.
 *   { bpm, notes: [eighth, note, lengthInEighths, velocity = 1] }   e.g. [0, 'E1', 1]
 */
export function playBass(bus, t0, { bpm, notes }) {
  const eighth = 60 / bpm / 2;
  const amp = createBassAmp(bus);
  notes.forEach(([at, note, len, vel = 1], i) => {
    atTime(t0 + at * eighth, () => {
      const f = 440 * 2 ** ((midi(note) - 69) / 12);
      const src = ctx.createBufferSource();
      src.buffer = pluck(f, { dur: 2.5, rho: 0.996, bright: 0.18, seed: 50 + (i % 7) }); // soft finger attack
      const g = ctx.createGain();
      const start = t0 + at * eighth,
        stop = start + len * eighth;
      g.gain.setValueAtTime(vel, start);
      g.gain.setTargetAtTime(0, stop - 0.01, 0.025);
      src.connect(g);
      g.connect(amp);
      src.start(start);
      src.stop(stop + 0.3);
      // round low body: a pure tone at the fundamental, under the string
      const sub = new OscillatorNode(ctx, { type: 'sine', frequency: f }),
        sg = ctx.createGain();
      sg.gain.setValueAtTime(0, start);
      sg.gain.linearRampToValueAtTime(0.35 * vel, start + 0.01);
      sg.gain.setTargetAtTime(0.2 * vel, start + 0.01, 0.15);
      sg.gain.setTargetAtTime(0, stop - 0.01, 0.03);
      sub.connect(sg);
      sg.connect(amp);
      sub.start(start);
      sub.stop(stop + 0.3);
    });
  });
}

/** Start times (seconds) of every bass note, for syncing animation. */
export const bassTimes = ({ bpm, notes }) => notes.map(([at]) => (at * 60) / bpm / 2);
