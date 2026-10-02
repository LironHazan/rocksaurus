import { piano } from './piano';
import { lead, pad } from './synth';
import { midi, type Note } from './notes';

export type KeyboardSound = 'piano' | 'lead' | 'pad';
export type Hand = 'L' | 'R';

/** [eighth, note, lengthInEighths, velocity = 0.55, hand = 'R'] */
export type KeyNote = readonly [at: number, note: Note, len: number, vel?: number, hand?: Hand];

/** A part played on the keyboard with one sound. Eighth-note grid; fractional eighths are fine (0.5 = a 16th). */
export interface KeyboardPart {
  bpm: number;
  sound: KeyboardSound;
  notes: readonly KeyNote[];
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

const VOICES = { piano, lead, pad } as const;

/** Schedules a keyboard part with its sound. */
export function playKeyboardPart(bus: AudioNode, t0: number, part: KeyboardPart): void {
  const eighth = 60 / part.bpm / 2;
  const voice = VOICES[part.sound];
  for (const [at, note, len, vel = 0.55] of part.notes) voice(bus, t0 + at * eighth, note, vel, len * eighth);
}
