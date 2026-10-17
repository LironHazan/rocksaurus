import { audio } from './context';
import { frequency, midi } from './notes';
import { pluck } from './guitar';
import { atTime } from './schedule';
import { softClip } from './curves';

// A lead guitar that sings, in two tones. Blues, the B.B. King / Albert King way: a warm semi-hollow through a
// small amp turned up to the edge of breaking up. Gypsy jazz, the Django way: clean, no drive, a nasal midrange
// bark and a heavy pick, dry, notes that pop and die quickly; chords chopped short for la pompe. The left hand is the same for both, so every note can carry it: a string bend, a release (picked
// already bent, let down), a slide into the note, and finger vibrato that comes in once the note has landed.

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
export type LeadNote = readonly [at: number, note: string, len: number, touch?: Touch];
/** One chord: when, its notes low to high (strummed down), how long, how hard. */
export type GuitarChord = readonly [at: number, notes: readonly string[], len: number, vel?: number];

/** Triplet eighths to a four-beat bar: the grid of anything that swings, or shuffles. */
const SWING_BAR = 12;

/** A phrase, written bar by bar: each note's `at` counts from the start of bar `bar` (bars of `perBar` units). */
export const phrase = (bar: number, notes: readonly LeadNote[], perBar = SWING_BAR): LeadNote[] =>
  notes.map(([at, note, len, touch]) => [bar * perBar + at, note, len, touch] as const);

/** A guitar part. Times are in grid units of `unit` seconds (a triplet eighth, for anything that swings). */
export interface LeadPart {
  unit: number;
  notes: readonly LeadNote[];
  chords: readonly GuitarChord[];
}

/** A plucked string: how slowly it dies (per period) and how bright the pick is (0..1). */
interface StringFeel {
  rho: number;
  bright: number;
}
/** What makes a guitar sound like itself: the strings, the vibrato hand, the amp (or the mic), the levels. */
export interface GuitarTone {
  lead: StringFeel;
  chord: StringFeel;
  /** Finger vibrato rate (Hz). */
  vibHz: number;
  /** Builds the amp (or the mic on the box), panned; returns its input. */
  amp(bus: AudioNode, pan: number): AudioNode;
  levels: { lead: number; chord: number };
}

/** How long a string's buffer rings (seconds): longer than any note. */
const RING_S = 6;
/** A bend's default rise, a slide's (seconds), and how long vibrato takes to come in fully. */
const BEND_TIME_S = 0.16;
const SLIDE_S = 0.07;
const VIB_IN_S = 0.22;
/** A release: how much of the note it stays bent before letting down, and how long letting down takes (seconds). */
const RELEASE_HOLD = 0.35;
const RELEASE_S = 0.18;
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
  return withRoom(bus, [
    filter('highpass', 85),
    filter('peaking', 180, 0.8, 3), // the hollow body
    filter('peaking', 750, 0.9, 4), // the cry
    new GainNode(ctx, { gain: 1.6 }), // a small amp, turned up
    new WaveShaperNode(ctx, { curve: WARM, oversample: '2x' }),
    filter('peaking', 2600, 1.0, -3), // no ice pick
    filter('lowpass', 3400, 0.6), // the speaker
    new GainNode(ctx, { gain: 0.5 }),
    new StereoPannerNode(ctx, { pan }),
  ]);
}

/** Clean, for gypsy jazz: no drive at all. The body, the nasal bark, the strings' zing taken off. Returns its input. */
function gypsyMic(bus: AudioNode, pan: number): AudioNode {
  return withRoom(bus, [
    filter('highpass', 110),
    filter('peaking', 230, 0.9, 3), // the box
    filter('peaking', 1100, 1.1, 4), // the bark
    filter('peaking', 4200, 1.2, -4), // no wire: the strings' metal zing, taken out
    filter('lowpass', 4600, 0.6), // past the mic, nothing glassy
    new GainNode(ctx, { gain: 0.42 }),
    new StereoPannerNode(ctx, { pan }),
  ]);
}

/** Wires a chain to the bus, with one soft slapback off the far wall of the room. Returns the chain's input. */
function withRoom(bus: AudioNode, chain: AudioNode[]): AudioNode {
  chain.reduce((a, b) => (a.connect(b), b)).connect(bus);
  const slap = new DelayNode(ctx, { delayTime: 0.11 });
  const slapLevel = new GainNode(ctx, { gain: 0.16 });
  const dark = filter('lowpass', 2200);
  chain.at(-1)!.connect(slap).connect(dark).connect(slapLevel).connect(bus);
  return chain[0]!;
}

/** Blues: long sustain, a warm pick, the slow wide "butterfly" vibrato. */
export const BLUES_TONE: GuitarTone = {
  lead: { rho: 0.9965, bright: 0.36 },
  chord: { rho: 0.995, bright: 0.28 },
  vibHz: 5.2,
  amp: bluesAmp,
  levels: { lead: 0.55, chord: 0.22 },
};

/** Gypsy jazz: heavy pick near the bridge (bright), notes that pop and die, a quicker, narrower vibrato; the
 * chords chopped short (la pompe) and up in the mix: they're the drums of this music. */
export const GYPSY_TONE: GuitarTone = {
  lead: { rho: 0.9925, bright: 0.42 },
  chord: { rho: 0.985, bright: 0.34 },
  vibHz: 6.4,
  amp: gypsyMic,
  levels: { lead: 0.9, chord: 0.3 },
};

/** Plays one string: the pluck, then whatever the left hand does to its pitch, then the damp when it ends. */
function string(
  amp: AudioNode,
  tone: GuitarTone,
  start: number,
  stop: number,
  note: string,
  touch: Touch,
  seed: number,
) {
  const src = new AudioBufferSourceNode(ctx, {
    buffer: pluck(frequency(note), { dur: RING_S, ...tone.lead, seed }),
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
    const lfo = new OscillatorNode(ctx, { frequency: tone.vibHz });
    const depth = new GainNode(ctx, { gain: 0 });
    depth.gain.setValueAtTime(0, landed);
    depth.gain.linearRampToValueAtTime(touch.vib, landed + VIB_IN_S);
    lfo.connect(depth).connect(src.detune);
    lfo.start(landed);
    lfo.stop(stop + DAMP_S * 4);
  }
  const g = new GainNode(ctx, { gain: tone.levels.lead * (touch.vel ?? 1) });
  g.gain.setTargetAtTime(0, stop, DAMP_S);
  src.connect(g).connect(amp);
  src.start(start);
  src.stop(stop + DAMP_S * 4);
}

/** Schedules a guitar part from `t0` in a tone: the lead in the middle, the chords a touch to the left. */
export function playLeadGuitar(bus: AudioNode, t0: number, { unit, notes, chords }: LeadPart, tone: GuitarTone): void {
  const lead = tone.amp(bus, 0.1);
  const comp = tone.amp(bus, -0.25);
  notes.forEach(([at, note, len, touch = {}], i) => {
    const start = t0 + at * unit;
    atTime(start, () => string(lead, tone, start, start + len * unit, note, touch, i));
  });
  chords.forEach(([at, chordNotes, len, vel = 1], i) => {
    const start = t0 + at * unit;
    atTime(start, () =>
      chordNotes.forEach((note, s) => {
        const src = new AudioBufferSourceNode(ctx, {
          buffer: pluck(frequency(note), { dur: RING_S, ...tone.chord, seed: 100 + i * 7 + s }),
        });
        const when = start + s * STRUM_GAP_S;
        const g = new GainNode(ctx, { gain: tone.levels.chord * vel });
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
export function playedNotes({ unit, notes }: LeadPart): PlayedNote[] {
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

/** How much a note is shaking at t in a tone (its vibrato depth in cents ÷ CENTS, for the animation's scale). */
export const vibratoAt = (n: PlayedNote, t: number, tone: GuitarTone): number =>
  t >= n.start && t <= n.end && n.touch.vib ? (n.touch.vib / CENTS) * Math.sin(2 * Math.PI * tone.vibHz * t) : 0;
