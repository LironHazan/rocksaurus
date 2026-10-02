export type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';

/** First three formant frequencies (Hz) of each vowel, for an adult-ish singing voice. */
export const FORMANTS: Record<Vowel, readonly [number, number, number]> = {
  a: [730, 1090, 2440], // "aah"
  e: [530, 1840, 2480], // "eh"
  i: [300, 2250, 3000], // "ee"
  o: [570, 840, 2410], // "oh"
  u: [320, 870, 2240], // "ooh"
};

/** How wide the mouth opens for each vowel (0..1) — drives the jaw animation. */
export const MOUTH_OPEN: Record<Vowel, number> = { a: 1, o: 0.8, e: 0.6, u: 0.45, i: 0.35 };

/** [eighth, note, lengthInEighths, vowel = 'a', velocity = 0.7] */
export type SungNote = readonly [at: number, note: string, len: number, vowel?: Vowel, vel?: number];

export interface VocalPart {
  bpm: number;
  notes: readonly SungNote[];
}

export interface TimedSungNote {
  start: number;
  end: number;
  vowel: Vowel;
  note: string;
}

/** Notes with start/end in seconds — for syncing the mouth to the voice. */
export function sungNotes({ bpm, notes }: VocalPart): TimedSungNote[] {
  const eighth = 60 / bpm / 2;
  return notes
    .map(([at, note, len, vowel = 'a']) => ({ start: at * eighth, end: (at + len) * eighth, vowel, note }))
    .sort((a, b) => a.start - b.start);
}

/**
 * How open the mouth should be at time t: opens quickly at each note, follows the vowel, closes between notes.
 * Pure function of t, so the animation is deterministic.
 */
export function mouthOpenAt(notes: readonly TimedSungNote[], t: number): number {
  let open = 0;
  for (const n of notes) {
    if (t < n.start || t > n.end + 0.1) continue;
    const attack = Math.min(1, (t - n.start) / 0.05);
    const release = t > n.end ? 1 - (t - n.end) / 0.1 : 1;
    open = Math.max(open, MOUTH_OPEN[n.vowel] * attack * release);
  }
  return open;
}
