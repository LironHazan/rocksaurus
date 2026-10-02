import { piano } from './piano';
import { lead, organ, pad } from './synth';
import { midi, type Note } from './notes';
import { atTime } from './schedule';

export type KeyboardSound = 'piano' | 'organ' | 'lead' | 'pad';
export type Hand = 'L' | 'R';

/** [eighth, note, lengthInEighths, velocity = 0.55, hand = 'R'] */
export type KeyNote = readonly [at: number, note: Note, len: number, vel?: number, hand?: Hand];

/** A part played on the keyboard with one sound. Eighth-note grid; fractional eighths are fine (0.5 = a 16th). */
export interface KeyboardPart {
  bpm: number;
  sound: KeyboardSound;
  notes: readonly KeyNote[];
  /** Mix level for the whole part (1 = as played). */
  gain?: number;
}

export interface TimedNote {
  midi: number;
  start: number;
  end: number;
  hand: Hand;
}

/** Every note with start/end in seconds — for pressing keys and moving paws in sync with the sound. */
export function timedNotes({ bpm, notes }: Pick<KeyboardPart, 'bpm' | 'notes'>): TimedNote[] {
  const eighth = 60 / bpm / 2;
  return notes
    .map(([at, note, len, , hand = 'R']) => ({ midi: midi(note), start: at * eighth, end: (at + len) * eighth, hand }))
    .sort((a, b) => a.start - b.start);
}

const VOICES = { piano, organ, lead, pad } as const;

/** Schedules a keyboard part with its sound. */
export function playKeyboardPart(bus: AudioNode, t0: number, part: KeyboardPart): void {
  const eighth = 60 / part.bpm / 2;
  const voice = VOICES[part.sound];
  const level = new GainNode(bus.context, { gain: part.gain ?? 1 });
  level.connect(bus);
  for (const [at, note, len, vel = 0.55] of part.notes) {
    const when = t0 + at * eighth;
    atTime(when, () => voice(level, when, note, vel, len * eighth));
  }
}
