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
 * Additive piano voice: slightly inharmonic partials, detuned unison strings, per-partial decay,
 * a closing lowpass (tone darkens as it rings), a hammer knock and a damper release.
 * @param {AudioNode} bus  where to send the sound
 * @param {number} when    AudioContext time to strike
 * @param {string|number} note  'C5' or a MIDI number
 * @param {number} vel     0..1 loudness
 * @param {number} dur     seconds until the key is released
 */
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
  for (let n = 1; n <= 8; n++) {
    const pf = f * n * Math.sqrt(1 + 0.00035 * n * n);
    if (pf > 15000) break;
    const amp = ((vel * 0.2) / Math.pow(n, 1.15)) * (n === 2 ? 1.25 : 1);
    const tau = ring / Math.pow(n, 0.75);
    for (const detune of n <= 2 ? [-1.8, 1.8] : [0]) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.value = pf;
      o.detune.value = detune;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(n <= 2 ? amp * 0.6 : amp, when + 0.005);
      g.gain.setTargetAtTime(0, when + 0.005, tau);
      g.gain.setTargetAtTime(0, when + dur, 0.25); // damper
      o.connect(g);
      g.connect(out);
      o.start(when);
      o.stop(when + dur + 2);
    }
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
