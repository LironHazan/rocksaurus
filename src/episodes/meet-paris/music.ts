import type { VocalPart, SungNote } from '../../audio/vowels';
import type { DrumPart } from '../../audio/drum-patterns';

// Rock in E minor, 4/4 @ 120 BPM: 1 eighth = 0.25 s, 1 bar = 2 s, 6 bars = 12 s.
export const BPM = 120;
export const BEAT = 60 / BPM;
export const SING_IN = 2; // seconds: she starts singing
export const BELT = 10; // seconds: the big high note

/** Lays out [note, lengthInEighths, vowel] phrases back to back from an eighth position. */
const phrase = (start: number, notes: readonly (readonly [string, number, SungNote[3]?])[]): SungNote[] => {
  let at = start;
  return notes.map(([note, len, vowel]) => {
    const n: SungNote = [at, note, len, vowel ?? 'a'];
    at += len;
    return n;
  });
};

export const vocal: VocalPart = {
  bpm: BPM,
  notes: [
    ...phrase(8, [
      ['E4', 2, 'o'],
      ['G4', 1],
      ['A4', 1],
      ['B4', 3],
      ['A4', 1, 'e'],
    ]), // bar 1
    ...phrase(16, [
      ['G4', 1],
      ['A4', 1],
      ['B4', 2],
      ['D5', 2, 'o'],
      ['B4', 2],
    ]), // bar 2
    ...phrase(24, [
      ['E5', 3],
      ['D5', 1, 'e'],
      ['B4', 2],
      ['A4', 2, 'o'],
    ]), // bar 3
    ...phrase(32, [
      ['G4', 1],
      ['A4', 1],
      ['B4', 1, 'e'],
      ['G4', 1],
      ['E4', 4, 'o'],
    ]), // bar 4
    // bar 5: the belt — slide up and hold a big "aah"
    [40, 'B4', 1, 'a', 0.8],
    [41, 'E5', 6, 'a', 0.9],
  ],
};

/** Soft bass: gentle quarter-note roots under the voice ([eighth, note, lengthInEighths, velocity]). */
export const bass = {
  bpm: BPM,
  notes: [
    ...(['E1', 'E1', 'C2', 'D2', 'E1'] as const).flatMap((root, bar) =>
      [0, 2, 4, 6].map(q => [bar * 8 + q, root, 1.8, 0.45] as const),
    ),
    [40, 'E1', 8, 0.5] as const,
  ],
};

const REST = '................';
/** Simple, light drums: hi-hat alone in the first bar, then a laid-back groove; crash on the belt. */
export const drums: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: [REST, ...Array(4).fill('x.......x.......'), 'x...............'].join(' '),
    snare: [REST, ...Array(4).fill('....x.......x...'), REST].join(' '),
    hat: [...Array(5).fill('x.x.x.x.x.x.x.x.'), REST].join(' '),
    crash: [REST, REST, REST, REST, REST, 'x...............'].join(' '),
  },
};
