import { speech, type SpokenLine } from '../../audio/babble';
import { TRIO_VOICES, type Trio } from '../../band/voices';
import { BAR, FINAL_CHORD, HEAD, OUT, RING, SOLO } from './music';

// The same rehearsal, later: the slow blues done, the trio goes straight on into gypsy jazz in G. Lulu counts it in on her sticks, Rory sets up la pompe, then the head, his solo, the head
// again, and the ending. Times are video seconds. The music is everything here (music.ts): no other sound but the
// room, and three lines at the end.

/** The final chord rings, then three lines. */
export const DURATION = FINAL_CHORD + RING + 3.6;

/** Bar `n` of the song (from 0, the count-in), in seconds. */
export const barAt = (n: number) => n * BAR;
/** The head's bar `n`, the solo's, the head out's (from 1, as a player counts them). */
export const headBar = (n: number) => barAt(HEAD + n - 1);
export const soloBar = (n: number) => barAt(SOLO + n - 1);
export const outBar = (n: number) => barAt(OUT + n - 1);

export const LINES: readonly SpokenLine<Trio>[] = [
  { from: FINAL_CHORD + 1.0, to: FINAL_CHORD + 2.8, who: 'Rory', text: 'Django played that with two fingers 😅' },
  { from: FINAL_CHORD + 3.0, to: FINAL_CHORD + 4.6, who: 'Lulu', text: 'So you’ve got three to spare 😏' },
  { from: FINAL_CHORD + 4.8, to: DURATION - 0.1, who: 'Tiki', text: 'Do they make a beret for a bass? 🧑‍🎨' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, TRIO_VOICES, 76);
