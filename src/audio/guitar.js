import { audio } from './context';
import { midi } from './piano';
import { rng } from '../engine/math';
import { atTime } from './schedule';

const { ctx } = audio;
const cache = new Map();

/**
 * Karplus–Strong plucked string: a burst of noise circulates in a delay line one period long,
 * and a lowpass in the loop makes it decay like a real string (highs die first).
 *   rho    — loss per period: ~0.998 rings out, ~0.86 sounds palm-muted
 *   bright — 0..1 pick brightness (lowpasses the noise burst)
 */
export function pluck(f, { dur, rho, bright, seed }) {
  const key = `${f}|${dur}|${rho}|${bright}|${seed}`;
  if (cache.has(key)) return cache.get(key);

  const sr = ctx.sampleRate,
    len = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, len, sr),
    y = buf.getChannelData(0);
  const D = sr / f - 1; // the 3-tap loop filter adds one sample of delay
  const N = Math.floor(D),
    frac = D - N;
  const r = rng(seed);

  let lp = 0,
    mean = 0;
  for (let i = 0; i <= N && i < len; i++) {
    lp += bright * (r() * 2 - 1 - lp);
    y[i] = lp;
    mean += lp;
  }
  mean /= N + 1;
  for (let i = 0; i <= N && i < len; i++) y[i] -= mean; // no DC thump

  let x1 = 0,
    x2 = 0;
  for (let i = N + 1; i < len; i++) {
    const x = y[i - N] + (y[i - N - 1] - y[i - N]) * frac; // fractional delay → in tune
    y[i] = rho * (0.25 * x + 0.5 * x1 + 0.25 * x2); // warm loop filter: highs fade fast
    x2 = x1;
    x1 = x;
  }
  cache.set(key, buf);
  return buf;
}

function distortionCurve(k = 2.2, n = 4096) {
  // asymmetric soft clip: positive half saturates a little later, like a tube stage → warmer, less fizz
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = x >= 0 ? Math.tanh(k * x) / Math.tanh(k) : Math.tanh(k * 1.3 * x) / Math.tanh(k * 1.3);
  }
  return c;
}
const CURVE = distortionCurve();

const filter = (type, frequency, Q = 0.7, gain = 0) => new BiquadFilterNode(ctx, { type, frequency, Q, gain });

/** Amp + speaker-cab chain: tighten lows → smooth → drive → soft clip → cab EQ → pan. */
function createAmp(bus, pan) {
  const chain = [
    filter('highpass', 90), // tighten low end
    filter('lowpass', 2400), // smooth pick fizz before it hits the clipper
    new GainNode(ctx, { gain: 3.6 }), // drive (moderate: crunch, not fizz)
    new WaveShaperNode(ctx, { curve: CURVE, oversample: '4x' }),
    filter('peaking', 200, 0.8, 4), // body / warmth
    filter('peaking', 2400, 1.0, -6), // tame harsh upper mids (where the 'metal' ring lives)
    filter('lowpass', 2800, 0.6), // speaker rolloff…
    filter('lowpass', 3800, 0.5), // …steeper, like a real 12" cab
    new GainNode(ctx, { gain: 0.2 }), // level
    new StereoPannerNode(ctx, { pan }),
  ];
  const hp = chain[0];
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  return hp;
}

/**
 * Plays a power-chord riff, double-tracked (two takes panned L/R, slightly different timing),
 * the way rock guitar is recorded.
 *   riff.bpm, riff.notes: [eighth, rootNote, lengthInEighths, 'mute' | 'open', velocity = 1]
 * Each chord is root + fifth + octave, strummed downward in a few milliseconds.
 */
export function playRiff(bus, t0, { bpm, notes }) {
  const eighth = 60 / bpm / 2;
  const takes = [
    { amp: createAmp(bus, -0.8), seed: 1, late: 0, cents: 0 },
    { amp: createAmp(bus, 0.8), seed: 2, late: 0.021, cents: 5 },
  ];

  for (const [at, root, len, style, vel = 1] of notes) {
    atTime(t0 + at * eighth, () => {
      const muted = style === 'mute';
      const start = t0 + at * eighth;
      const stop = start + len * eighth;
      for (const take of takes) {
        [0, 7, 12].forEach((interval, i) => {
          const f = 440 * 2 ** ((midi(root) + interval - 69 + take.cents / 100) / 12);
          const src = ctx.createBufferSource();
          src.buffer = pluck(
            f,
            muted
              ? { dur: 0.45, rho: 0.88, bright: 0.22, seed: take.seed * 31 + i }
              : { dur: 3.0, rho: 0.998, bright: 0.32, seed: take.seed * 31 + i },
          );
          const g = ctx.createGain();
          const when = start + take.late + i * 0.006; // downstroke strum
          g.gain.setValueAtTime((muted ? 0.8 : 1) * vel, when);
          g.gain.setTargetAtTime(0, stop + take.late, 0.03); // fret hand lets go
          src.connect(g);
          g.connect(take.amp);
          src.start(when);
          src.stop(stop + 0.4);
        });
      }
    });
  }
}
