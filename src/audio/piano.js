import { audio } from './context';
import { rng } from '../engine/math';
import { midi } from './notes';

const { ctx } = audio;

const noiseBuf = (() => {
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const d = b.getChannelData(0),
    r = rng(5);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  return b;
})();

export { midi } from './notes';

/**
 * Piano voice: a rich harmonic waveform on two detuned unison strings, a closing lowpass (tone darkens as
 * it rings), a hammer knock and a damper release. Light enough to play dense parts in real time.
 * @param {AudioNode} bus  where to send the sound
 * @param {number} when    AudioContext time to strike
 * @param {string|number} note  'C5' or a MIDI number
 * @param {number} vel     0..1 loudness
 * @param {number} dur     seconds until the key is released
 */
// All of a piano note's overtones baked into one waveform (2nd partial a little strong, the rest falling off),
// so each note needs only two oscillators instead of a stack of them. Higher partials still fade first,
// because the lowpass filter below closes as the note rings.
let pianoWave = null;
function getPianoWave() {
  if (pianoWave) return pianoWave;
  const N = 9;
  const real = new Float32Array(N),
    imag = new Float32Array(N);
  for (let n = 1; n < N; n++) imag[n] = (1 / Math.pow(n, 1.15)) * (n === 2 ? 1.25 : 1);
  pianoWave = ctx.createPeriodicWave(real, imag);
  return pianoWave;
}

export function piano(bus, when, note, vel = 0.5, dur = 1) {
  const f = 440 * 2 ** ((midi(note) - 69) / 12);
  const out = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.4;
  lp.frequency.setValueAtTime(Math.min(10000, f * 7 + 2500 * vel), when);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f * 2.2, 700), when + 1.6);
  out.connect(lp);
  lp.connect(bus);

  const ring = 2.4 * Math.pow(261.6 / f, 0.45); // low notes sustain longer
  const amp = vel * 0.2;
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(amp, when + 0.005);
  out.gain.setTargetAtTime(0, when + 0.005, ring * 0.6);
  out.gain.setTargetAtTime(0, when + dur, 0.25); // damper
  const stop = when + dur + 1.2;
  for (const detune of [-1.8, 1.8]) {
    // two slightly detuned "strings", like a real piano's unison
    const o = ctx.createOscillator();
    o.setPeriodicWave(getPianoWave());
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(out);
    o.start(when);
    o.stop(stop);
  }

  const hn = ctx.createBufferSource(),
    hf = ctx.createBiquadFilter(),
    hg = ctx.createGain();
  hn.buffer = noiseBuf;
  hf.type = 'bandpass';
  hf.frequency.value = Math.min(4000, f * 3);
  hf.Q.value = 1.5;
  hg.gain.setValueAtTime(vel * 0.05, when);
  hg.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  hn.connect(hf);
  hf.connect(hg);
  hg.connect(out);
  hn.start(when);
}
