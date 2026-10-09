import { audio } from './context';
import { frequency, type Note } from './notes';

const { ctx } = audio;

/** Bright, singing synth lead: two detuned saws through a resonant filter that opens on each note, delayed vibrato. */
export function lead(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 0.5): void {
  const f = frequency(note);
  const out = ctx.createGain();
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', Q: 4 });
  filter.frequency.setValueAtTime(900, when);
  filter.frequency.linearRampToValueAtTime(Math.min(9000, f * 9), when + 0.03);
  filter.frequency.setTargetAtTime(Math.min(4500, f * 5), when + 0.03, 0.15);
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.11 * vel, when + 0.012);
  out.gain.setTargetAtTime(0.08 * vel, when + 0.012, 0.2);
  out.gain.setTargetAtTime(0, when + dur, 0.06);
  filter.connect(out);
  out.connect(bus);

  const vibrato = new OscillatorNode(ctx, { frequency: 5.6 });
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, when);
  depth.gain.linearRampToValueAtTime(dur > 0.4 ? 12 : 0, when + Math.min(dur, 0.45)); // cents, only on longer notes
  vibrato.connect(depth);
  for (const detune of [-7, 7]) {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f, detune });
    depth.connect(o.detune);
    o.connect(filter);
    o.start(when);
    o.stop(when + dur + 0.4);
  }
  vibrato.start(when);
  vibrato.stop(when + dur + 0.4);
}

/** Soft, wide pad: three detuned saws, slow attack and release, warm filter. */
export function pad(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 2): void {
  const f = frequency(note);
  const out = ctx.createGain();
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1100, Q: 0.6 });
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.05 * vel, when + 0.45);
  out.gain.setTargetAtTime(0, when + dur, 0.35);
  filter.connect(out);
  out.connect(bus);
  for (const detune of [-12, 0, 12]) {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f, detune });
    const pan = new StereoPannerNode(ctx, { pan: detune / 16 });
    o.connect(pan);
    pan.connect(filter);
    o.start(when);
    o.stop(when + dur + 1.5);
  }
}

// Tonewheel organ drawbars (footage → ratio to the played note, level): 16', 8', 5⅓', 4', 2⅔', 2'
const DRAWBARS: readonly (readonly [number, number])[] = [
  [0.5, 0.8],
  [1, 1],
  [1.5, 0.7],
  [2, 0.55],
  [3, 0.3],
  [4, 0.22],
];

let organWaveCache: PeriodicWave | null = null;
function organWave(): PeriodicWave {
  if (organWaveCache) return organWaveCache;
  const N = 9; // harmonics of the 16' tone: 1 = 16', 2 = 8', 3 = 5⅓', 4 = 4', 6 = 2⅔', 8 = 2'
  const real = new Float32Array(N);
  const imag = new Float32Array(N);
  for (const [ratio, level] of DRAWBARS) imag[Math.round(ratio * 2)] = level;
  organWaveCache = ctx.createPeriodicWave(real, imag);
  return organWaveCache;
}

/**
 * Classic tonewheel organ (the prog-rock keyboard sound): pure sine "drawbars" stacked on each key, a short key
 * click, and a rotating-speaker shimmer (gentle tremolo + vibrato). Starts and stops almost instantly, like the real thing.
 */
export function organ(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 0.5): void {
  const f = frequency(note);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.07 * vel, when + 0.008);
  out.gain.setTargetAtTime(0, when + dur, 0.03);
  const tone = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 4500, Q: 0.5 });
  tone.connect(out);
  out.connect(bus);

  // rotating speaker: amplitude + pitch wobble
  const rotor = new OscillatorNode(ctx, { frequency: 6.2 });
  const trem = new GainNode(ctx, { gain: 0.012 * vel });
  const vib = new GainNode(ctx, { gain: 6 }); // cents
  rotor.connect(trem);
  trem.connect(out.gain);
  rotor.connect(vib);

  // all drawbars in one waveform, built on the 16' (half-frequency) tone so every footage is a harmonic of it
  const o = new OscillatorNode(ctx, { frequency: f / 2 });
  o.setPeriodicWave(organWave());
  vib.connect(o.detune);
  o.connect(tone);
  o.start(when);
  o.stop(when + dur + 0.2);
  rotor.start(when);
  rotor.stop(when + dur + 0.2);

  const click = new OscillatorNode(ctx, { type: 'square', frequency: f * 8 });
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.02 * vel, when);
  cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.012);
  click.connect(cg);
  cg.connect(bus);
  click.start(when);
  click.stop(when + 0.02);
}
