import { audio } from './context';
import { frequency, midi } from './notes';
import { pluck } from './guitar';
import { atTime } from './schedule';
import { softClip } from './curves';

// A blues lead guitar, the B.B. King / Albert King way: a warm semi-hollow tone through a small amp turned up just
// to the edge of breaking up, single notes that sing. What makes it blues is in the left hand, so every note can
// carry it: a string bend (up to pitch, smoothly, then held), a release (picked already bent, let down), a slide into
// the note, and finger vibrato that starts a moment after the note lands. Chords are strummed 9ths, comped softly.

const { ctx } = audio;

/** How a note is played. Bends are in semitones (2 = a whole step), vibrato in cents either side of the pitch. */
export interface Touch {
  /** Bend up this far after the pick… */
  bend?: number;
  /** …taking this long to get there (seconds; B.B. bends are smooth, never snapped). */
  bendTime?: number;
  /** Picked already bent up this far, then let down to the fretted note. */
  release?: number;
  /** Slide into the note from this one. */
  slideFrom?: string;
  /** Finger vibrato, cents either side, once the note (or its bend) has landed. */
  vib?: number;
  /** How hard it's picked, 0..1. */
  vel?: number;
}
/** One note: when (grid units), the fretted note, how long (grid units) and how it's played. */
export type BluesNote = readonly [at: number, note: string, len: number, touch?: Touch];
/** One comped chord: when, its notes low to high (strummed down), how long, how hard. */
export type BluesChord = readonly [at: number, notes: readonly string[], len: number, vel?: number];

/** A blues guitar part. Times are in grid units of `unit` seconds (for a 12/8 slow blues, a triplet eighth). */
export interface BluesPart {
  unit: number;
  notes: readonly BluesNote[];
  chords: readonly BluesChord[];
}

/** The plucked string: how long its buffer rings (seconds), how slowly it dies, how bright the pick is. */
const STRING = { ring: 6, rho: 0.9965, bright: 0.36 } as const;
const CHORD_STRING = { rho: 0.995, bright: 0.28 } as const;
/** A bend's default rise, a slide's (seconds), and how long vibrato takes to come in fully. */
const BEND_TIME_S = 0.16;
const SLIDE_S = 0.07;
const VIB_IN_S = 0.22;
/** Finger vibrato rate (Hz): a slow, wide shake, like B.B.'s "butterfly" wrist. */
const VIB_HZ = 5.2;
/** A release: how much of the note it stays bent before letting down, and how long letting down takes (seconds). */
const RELEASE_HOLD = 0.35;
const RELEASE_S = 0.18;
/** Levels: a lead note and a comped chord string. */
const LEAD_LEVEL = 0.55;
const CHORD_LEVEL = 0.22;
/** A strum: the gap between strings (seconds), and how quickly the fret hand damps a note when it ends. */
const STRUM_GAP_S = 0.016;
const DAMP_S = 0.05;
/** Cents in a semitone. */
const CENTS = 100;

const filter = (type: BiquadFilterType, frequency: number, Q = 0.7, gain = 0) =>
  new BiquadFilterNode(ctx, { type, frequency, Q, gain });

/** A soft, symmetric tube-ish clip: just enough to thicken the note when it's picked hard. */
const WARM = softClip(1.4);

/**
 * The amp: a hollow-body's round low end, a vocal midrange bump (where the "cry" lives), a little drive, a 12"
 * speaker's roll-off, and a short slapback from the room. Returns its input.
 */
function bluesAmp(bus: AudioNode, pan: number): AudioNode {
  const chain: AudioNode[] = [
    filter('highpass', 85),
    filter('peaking', 180, 0.8, 3), // the hollow body
    filter('peaking', 750, 0.9, 4), // the cry
    new GainNode(ctx, { gain: 1.6 }), // a small amp, turned up
    new WaveShaperNode(ctx, { curve: WARM, oversample: '2x' }),
    filter('peaking', 2600, 1.0, -3), // no ice pick
    filter('lowpass', 3400, 0.6), // the speaker
    new GainNode(ctx, { gain: 0.5 }),
    new StereoPannerNode(ctx, { pan }),
  ];
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  // the room: one soft slapback off the far wall
  const slap = new DelayNode(ctx, { delayTime: 0.11 });
  const slapLevel = new GainNode(ctx, { gain: 0.16 });
  const dark = filter('lowpass', 2200);
  chain.at(-1)!.connect(slap).connect(dark).connect(slapLevel).connect(bus);
  return chain[0]!;
}

/** Plays one string: the pluck, then whatever the left hand does to its pitch, then the damp when it ends. */
function string(amp: AudioNode, start: number, stop: number, note: string, touch: Touch, level: number, seed: number) {
  const src = new AudioBufferSourceNode(ctx, {
    buffer: pluck(frequency(note), { dur: STRING.ring, rho: STRING.rho, bright: STRING.bright, seed }),
  });
  const rate = src.playbackRate;
  let landed = start;
  if (touch.slideFrom) {
    rate.setValueAtTime(frequency(touch.slideFrom) / frequency(note), start);
    rate.linearRampToValueAtTime(1, start + SLIDE_S);
    landed = start + SLIDE_S;
  }
  if (touch.release) {
    const held = start + (stop - start) * RELEASE_HOLD;
    rate.setValueAtTime(2 ** (touch.release / 12), start);
    rate.setValueAtTime(2 ** (touch.release / 12), held);
    rate.linearRampToValueAtTime(1, held + RELEASE_S);
    landed = held + RELEASE_S;
  }
  if (touch.bend) {
    const rise = touch.bendTime ?? BEND_TIME_S;
    rate.setValueAtTime(1, landed);
    rate.linearRampToValueAtTime(2 ** (touch.bend / 12), landed + rise);
    landed += rise;
  }
  if (touch.vib) {
    // the vibrato comes in once the note has landed, and swells: the finger finds it
    const lfo = new OscillatorNode(ctx, { frequency: VIB_HZ });
    const depth = new GainNode(ctx, { gain: 0 });
    depth.gain.setValueAtTime(0, landed);
    depth.gain.linearRampToValueAtTime(touch.vib, landed + VIB_IN_S);
    lfo.connect(depth).connect(src.detune);
    lfo.start(landed);
    lfo.stop(stop + DAMP_S * 4);
  }
  const g = new GainNode(ctx, { gain: level * (touch.vel ?? 1) });
  g.gain.setTargetAtTime(0, stop, DAMP_S);
  src.connect(g).connect(amp);
  src.start(start);
  src.stop(stop + DAMP_S * 4);
}

/** Schedules a blues guitar part from `t0`: the lead in the middle, the comping chords a touch to the left. */
export function playBluesGuitar(bus: AudioNode, t0: number, { unit, notes, chords }: BluesPart): void {
  const lead = bluesAmp(bus, 0.1);
  const comp = bluesAmp(bus, -0.25);
  notes.forEach(([at, note, len, touch = {}], i) => {
    const start = t0 + at * unit;
    atTime(start, () => string(lead, start, start + len * unit, note, touch, LEAD_LEVEL, i));
  });
  chords.forEach(([at, chordNotes, len, vel = 1], i) => {
    const start = t0 + at * unit;
    atTime(start, () =>
      chordNotes.forEach((note, s) => {
        const src = new AudioBufferSourceNode(ctx, {
          buffer: pluck(frequency(note), { dur: STRING.ring, ...CHORD_STRING, seed: 100 + i * 7 + s }),
        });
        const when = start + s * STRUM_GAP_S;
        const g = new GainNode(ctx, { gain: CHORD_LEVEL * vel });
        g.gain.setTargetAtTime(0, start + len * unit, DAMP_S);
        src.connect(g).connect(comp);
        src.start(when);
        src.stop(start + len * unit + DAMP_S * 4);
      }),
    );
  });
}

/** A note as the animation needs it: when it starts and ends (seconds), its pitch, and how far it's bent at t. */
export interface PlayedNote {
  start: number;
  end: number;
  midi: number;
  touch: Touch;
}
/** Every lead note of a part, sorted, in seconds: what the paws and the face play along to. */
export function playedNotes({ unit, notes }: BluesPart): PlayedNote[] {
  return notes
    .map(([at, note, len, touch = {}]) => ({ start: at * unit, end: (at + len) * unit, midi: midi(note), touch }))
    .sort((a, b) => a.start - b.start);
}

/** How far a note is bent at t (semitones above the fretted note): its bend rising, or its release letting down. */
export function bendAt(n: PlayedNote, t: number): number {
  const s = t - n.start;
  if (s < 0 || t > n.end) return 0;
  if (n.touch.release) {
    const held = (n.end - n.start) * RELEASE_HOLD;
    return n.touch.release * (s < held ? 1 : Math.max(0, 1 - (s - held) / RELEASE_S));
  }
  if (!n.touch.bend) return 0;
  const lead = n.touch.slideFrom ? SLIDE_S : 0;
  return n.touch.bend * Math.min(1, Math.max(0, (s - lead) / (n.touch.bendTime ?? BEND_TIME_S)));
}

/** How much a note is shaking at t (0..1 of its vibrato depth, in cents ÷ CENTS for the animation's scale). */
export const vibratoAt = (n: PlayedNote, t: number): number =>
  t >= n.start && t <= n.end && n.touch.vib ? (n.touch.vib / CENTS) * Math.sin(2 * Math.PI * VIB_HZ * t) : 0;
