// A physically-inspired piano tone, rendered sample by sample (pure math, no Web Audio, so it's testable).
//
// What makes a piano sound like a piano and not a synth:
//  - inharmonic overtones: a stiff string's partials run slightly sharp (f_n = n·f0·√(1 + B·n²))
//  - 2–3 strings per note, a few cents apart, so the tone shimmers and "beats"
//  - the hammer strikes 1/7 along the string, which mutes some overtones (the 7th, 14th…)
//  - a two-stage decay: a bright "ping" that dies fast, then a long, darker aftersound
//  - high overtones fade much faster than low ones
//  - a short, soft hammer knock at the very start

const UNISON_CENTS = [0, 1.1, -0.9];

/** Peak-normalized samples of one piano note (MIDI number), `seconds` long. */
export function pianoSamples(midiNote: number, sampleRate: number, seconds: number): Float32Array<ArrayBuffer> {
  const n = Math.floor(sampleRate * seconds);
  const out = new Float32Array(new ArrayBuffer(n * 4));
  const f0 = 440 * 2 ** ((midiNote - 69) / 12);
  const strings = midiNote < 40 ? 1 : midiNote < 52 ? 2 : 3;
  const B = 0.00008 * 2 ** ((midiNote - 48) / 18); // stiffer (more inharmonic) up high
  const ring = 1.6 * (261.6 / f0) ** 0.5; // low notes ring longer
  const hammer = 1 / 7;
  const nyquist = sampleRate / 2.2;

  for (let p = 1; p <= 24; p++) {
    const fp = p * f0 * Math.sqrt(1 + B * p * p);
    if (fp > nyquist || fp > 12000) break;
    const amp = (Math.abs(Math.sin(Math.PI * p * hammer)) + 0.08) / p ** 1.05;
    // per-partial decay: higher partials die faster; fast "ping" + slow aftersound
    const tauFast = (ring * 0.35) / (1 + 0.7 * (p - 1));
    const tauSlow = (ring * 2.2) / (1 + 0.35 * (p - 1));
    const dFast = Math.exp(-1 / (tauFast * sampleRate));
    const dSlow = Math.exp(-1 / (tauSlow * sampleRate));
    for (let s = 0; s < strings; s++) {
      const f = fp * 2 ** (UNISON_CENTS[s]! / 1200);
      const w = (2 * Math.PI * f) / sampleRate;
      // sine by recurrence (y[i] = 2cos(w)·y[i-1] − y[i-2]), much cheaper than Math.sin per sample
      const k = 2 * Math.cos(w);
      const phase = (p * 1.7) % (2 * Math.PI); // the hammer strikes all strings of a note together
      let y1 = Math.sin(phase),
        y2 = Math.sin(phase - w);
      let eFast = 0.75 * (amp / strings),
        eSlow = 0.25 * (amp / strings);
      for (let i = 0; i < n; i++) {
        const y = k * y1 - y2;
        y2 = y1;
        y1 = y;
        out[i]! += y * (eFast + eSlow);
        eFast *= dFast;
        eSlow *= dSlow;
      }
    }
  }

  // hammer knock: a few ms of soft, low noise
  let seed = midiNote * 9301 + 49297;
  let lp = 0;
  const knock = Math.floor(sampleRate * 0.012);
  for (let i = 0; i < knock; i++) {
    seed = (seed * 16807) % 2147483647;
    lp += ((seed / 2147483647) * 2 - 1 - lp) * 0.15;
    out[i]! += lp * 0.25 * (1 - i / knock);
  }

  // 3 ms attack, then normalize
  const attack = Math.floor(sampleRate * 0.003);
  for (let i = 0; i < attack; i++) out[i]! *= i / attack;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]!));
  if (peak > 0) for (let i = 0; i < n; i++) out[i]! /= peak;
  return out;
}
