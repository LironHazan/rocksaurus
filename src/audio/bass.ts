import { audio } from './context';
import { softClip } from './curves';
import { midi } from './piano';
import { pluck } from './guitar';
import { atTime } from './schedule';

/** A bass line: { bpm, notes: [eighth, note, lengthInEighths, velocity = 1] }. */
export interface BassPart {
  bpm: number;
  notes: readonly (readonly [at: number, note: string, len: number, vel?: number])[];
}

const { ctx } = audio;
/** How many different plucks a part cycles through (by note), so a repeated note never sounds machine-identical. */
const PLUCK_TAKES = 7;

/**
 * How a bass sounds. Electric: a finger-style electric through a warm amp. Upright: a double bass on a mic, the
 * gut-ish thump of a pizzicato (a dull pluck that dies quickly, more of the round body under it, no zing at all).
 */
interface BassSound {
  /** The pluck: how slowly it dies (per period) and how bright (0..1). */
  rho: number;
  bright: number;
  /** The round body under the string, a sine at the fundamental: its peak, and where it settles. */
  body: { peak: number; hold: number };
  /** The amp's (or the mic's) top end, Hz: rolled off from `warm`, nothing above `top`. */
  warm: number;
  top: number;
  /** The whole bass's level. */
  level: number;
}
export type BassTone = 'electric' | 'upright';
const SOUNDS: Record<BassTone, BassSound> = {
  electric: { rho: 0.996, bright: 0.18, body: { peak: 0.35, hold: 0.2 }, warm: 900, top: 1400, level: 0.55 },
  upright: { rho: 0.988, bright: 0.06, body: { peak: 0.6, hold: 0.28 }, warm: 500, top: 650, level: 0.5 },
};

/** Warm bass amp: low-end boost, gentle drive for growl, then a darker cab. */
function createBassAmp(bus: AudioNode, { warm, top, level }: BassSound) {
  const chain: AudioNode[] = [
    new BiquadFilterNode(ctx, { type: 'highpass', frequency: 35 }),
    new BiquadFilterNode(ctx, { type: 'lowshelf', frequency: 120, gain: 4 }),
    new GainNode(ctx, { gain: 1.4 }),
    new WaveShaperNode(ctx, { curve: softClip(1.1, BASS_CURVE_RES), oversample: '4x' }), // just a touch of warmth
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: warm, Q: 0.5 }), // dark, round tone…
    new BiquadFilterNode(ctx, { type: 'lowpass', frequency: top, Q: 0.5 }), // …with a steep roll-off (no zing)
    new GainNode(ctx, { gain: level }),
  ];
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  return chain[0]!;
}

/** The bass's clip curve resolution (finer than the default: the bass sits in it longer). */
const BASS_CURVE_RES = 2048;

/**
 * Finger-style bass line, one note at a time.
 *   { bpm, notes: [eighth, note, lengthInEighths, velocity = 1] }   e.g. [0, 'E1', 1]
 */
export function playBass(bus: AudioNode, t0: number, { bpm, notes }: BassPart, tone: BassTone = 'electric'): void {
  const eighth = 60 / bpm / 2;
  const sound = SOUNDS[tone];
  const amp = createBassAmp(bus, sound);
  notes.forEach(([at, note, len, vel = 1], i) => {
    atTime(t0 + at * eighth, () => {
      const f = 440 * 2 ** ((midi(note) - 69) / 12);
      const src = ctx.createBufferSource();
      src.buffer = pluck(f, { dur: 2.5, rho: sound.rho, bright: sound.bright, seed: 50 + (i % PLUCK_TAKES) }); // soft finger attack
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
      sg.gain.linearRampToValueAtTime(sound.body.peak * vel, start + 0.01);
      sg.gain.setTargetAtTime(sound.body.hold * vel, start + 0.01, 0.15);
      sg.gain.setTargetAtTime(0, stop - 0.01, 0.03);
      sub.connect(sg);
      sg.connect(amp);
      sub.start(start);
      sub.stop(stop + 0.3);
    });
  });
}

/** Start times (seconds) of every bass note, for syncing animation. */
export const bassTimes = ({ bpm, notes }: BassPart): number[] => notes.map(([at]) => (at * 60) / bpm / 2);
