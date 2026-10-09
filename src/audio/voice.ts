import { audio } from './context';
import { frequency } from './notes';
import { FORMANTS, type VocalPart, type Vowel } from './vowels';
import { atTime } from './schedule';

const { ctx } = audio;

let breath: AudioBuffer | null = null;
function breathNoise(): AudioBuffer {
  if (breath) return breath;
  breath = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = breath.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return breath;
}

/**
 * One sung note, by formant synthesis: a buzzy source (like vocal cords) shaped by three resonant
 * band-pass filters (like the throat and mouth) tuned to the vowel. The pitch scoops up into the note
 * like a real singer, and vibrato blooms on longer notes.
 */
export function sing(bus: AudioNode, when: number, note: string, vowel: Vowel = 'a', vel = 0.7, dur = 0.5): void {
  const f = frequency(note);
  const end = when + dur;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.5 * vel, when + 0.04);
  out.gain.setTargetAtTime(0.42 * vel, when + 0.04, 0.2);
  out.gain.setTargetAtTime(0, end, 0.06);
  const air = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 5200 });
  air.connect(out);
  out.connect(bus);

  const formants = FORMANTS[vowel].map((freq, i) => {
    const bp = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: freq, Q: [7, 9, 11][i] });
    const g = new GainNode(ctx, { gain: [1, 0.55, 0.3][i] });
    bp.connect(g);
    g.connect(air);
    return bp;
  });

  // source: two slightly detuned saws (a fuller voice), scooping up into the pitch, then vibrato
  const vibrato = new OscillatorNode(ctx, { frequency: 5.4 });
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, when);
  depth.gain.linearRampToValueAtTime(dur > 0.45 ? 22 : 6, when + Math.min(0.5, dur)); // cents
  vibrato.connect(depth);
  for (const detune of [-4, 4]) {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f });
    o.detune.setValueAtTime(detune - 70, when); // scoop up from below
    o.detune.linearRampToValueAtTime(detune, when + 0.09);
    depth.connect(o.detune);
    for (const bp of formants) o.connect(bp);
    o.start(when);
    o.stop(end + 0.3);
  }
  vibrato.start(when);
  vibrato.stop(end + 0.3);

  // a little breath at the start of each phrase
  const noise = new AudioBufferSourceNode(ctx, { buffer: breathNoise() });
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.05 * vel, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
  noise.connect(formants[1]!);
  noise.connect(ng);
  ng.connect(air);
  noise.start(when, (when * 3.7) % 0.8);
  noise.stop(when + 0.15);
}

export function playVocal(bus: AudioNode, t0: number, { bpm, notes }: VocalPart): void {
  const eighth = 60 / bpm / 2;
  for (const [at, note, len, vowel = 'a', vel = 0.7] of notes) {
    const when = t0 + at * eighth;
    atTime(when, () => sing(bus, when, note, vowel, vel, len * eighth));
  }
}
