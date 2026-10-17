import { speech, type SpokenLine, type Voice } from '../../audio/babble';
import { BAR, BEAT, CHORUS_BARS, FINAL_CHORD, INTRO_BARS, LULU_IN, RING, TIKI_IN } from './music';

// 7 PM, the rehearsal room. Rory's early, eyes closed, playing a slow blues in A by himself. Lulu comes in, sees
// him lost in it, tiptoes to the drums without a sound, and on the last beat of his fourth bar slides in under him
// with a slow shuffle. Halfway through their chorus Tiki Taka slips in too, bass on, and walks the bass under the
// second. Rory doesn't open his eyes until the last chord. Times are video seconds. The music is everything here
// (music.ts): no other sound but the room and their steps.

/** The final chord rings, then three lines. */
export const DURATION = FINAL_CHORD + RING + 3.2;

export const CUE = {
  /** Lulu comes in (from the front right), tiptoes past the amp to the kit… */
  sneak: [BAR * 2.55, LULU_IN - BEAT * 1.5] as const,
  /** …sits down, sticks up, waits for the one… */
  sit: LULU_IN - BEAT * 1.5,
  /** …and comes in on the pickup. */
  in: LULU_IN,
  /** Tiki Taka slips in (from the back left, behind the amp) in bar 9 of the first chorus, plugs in… */
  tiki: [INTRO_BARS * BAR + 8 * BAR, TIKI_IN - BEAT * 2] as const,
  /** …and comes in on his pickup into the second chorus. */
  tikiIn: TIKI_IN,
  /** The last chord, and Rory opening his eyes to find her there. */
  final: FINAL_CHORD,
  noticed: FINAL_CHORD + 0.7,
} as const;

/** Bar `n` of the song (from 0), in seconds. */
export const barAt = (n: number) => n * BAR;
/** The first chorus's bar `n` (from 1, as a blues player counts them). */
export const chorusBar = (n: number) => barAt(INTRO_BARS + n - 1);
/** The second chorus's bar `n` (from 1). */
export const secondBar = (n: number) => barAt(INTRO_BARS + CHORUS_BARS + n - 1);

const CAST = ['Rory', 'Lulu', 'Tiki'] as const;
export type Who = (typeof CAST)[number];

export const LINES: readonly SpokenLine<Who>[] = [
  { from: FINAL_CHORD + 1.0, to: FINAL_CHORD + 2.8, who: 'Rory', text: '…How long have you two been there? 😳' },
  { from: FINAL_CHORD + 3.0, to: FINAL_CHORD + 4.6, who: 'Lulu', text: 'Since bar four 😏🥁' },
  { from: FINAL_CHORD + 4.8, to: DURATION - 0.1, who: 'Tiki', text: 'I caught the turnaround 😎' },
];

const VOICES: Record<Who, Voice> = {
  Rory: { notes: ['G3', 'A3', 'C4', 'D4'], rate: 0.13 },
  Lulu: { notes: ['F3', 'G3', 'A3', 'C4'], rate: 0.17 },
  Tiki: { notes: ['C3', 'D3', 'F3', 'G3'], rate: 0.15 },
};

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, VOICES, 61);
