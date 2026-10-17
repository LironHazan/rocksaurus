import { speech, type SpokenLine, type Voice } from '../../audio/babble';
import { BAR, BEAT, FINAL_CHORD, INTRO_BARS, LULU_IN, RING } from './music';

// 7 PM, the rehearsal room. Rory's early, eyes closed, playing a slow blues in A by himself. Lulu comes in, sees
// him lost in it, tiptoes to the drums without a sound, and on the last beat of his fourth bar slides in under him
// with a slow shuffle. He doesn't open his eyes until the last chord. Times are video seconds. The music is
// everything here (music.ts): no other sound but the room and her steps.

/** The final chord rings, then two lines. */
export const DURATION = FINAL_CHORD + RING + 1.4;

export const CUE = {
  /** Lulu comes in (from the front right), tiptoes past the amp to the kit… */
  sneak: [BAR * 2.55, LULU_IN - BEAT * 1.5] as const,
  /** …sits down, sticks up, waits for the one… */
  sit: LULU_IN - BEAT * 1.5,
  /** …and comes in on the pickup. */
  in: LULU_IN,
  /** The last chord, and Rory opening his eyes to find her there. */
  final: FINAL_CHORD,
  noticed: FINAL_CHORD + 0.7,
} as const;

/** Bar `n` of the song (from 0), in seconds. */
export const barAt = (n: number) => n * BAR;
/** The chorus's bar `n` (from 1, as a blues player counts them). */
export const chorusBar = (n: number) => barAt(INTRO_BARS + n - 1);

const CAST = ['Rory', 'Lulu'] as const;
export type Who = (typeof CAST)[number];

export const LINES: readonly SpokenLine<Who>[] = [
  { from: FINAL_CHORD + 1.0, to: FINAL_CHORD + 2.6, who: 'Rory', text: '…How long have you been there? 😳' },
  { from: FINAL_CHORD + 2.8, to: DURATION - 0.1, who: 'Lulu', text: 'Since bar four 😏🥁' },
];

const VOICES: Record<Who, Voice> = {
  Rory: { notes: ['G3', 'A3', 'C4', 'D4'], rate: 0.13 },
  Lulu: { notes: ['F3', 'G3', 'A3', 'C4'], rate: 0.17 },
};

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, VOICES, 61);
