import type { DrumPart } from '../../audio/drum-patterns';
import type { BluesChord, BluesNote, BluesPart } from '../../audio/blues-guitar';

// A slow blues in A, 12/8 at 70 (dotted-quarter) beats a minute: four beats a bar, each split in three (the
// shuffle's triplet feel), so the grid is triplet eighths, 12 to the bar. Rory plays four bars alone over A
// (rubato in spirit, laid back), Lulu sneaks in a pickup on the last beat of bar 4, and they play one 12-bar
// chorus together:
//
//   | A9  | D9  | A9  | A9  |     the quick change to the IV in bar 2
//   | D9  | D9  | A9  | A9  |
//   | E9  | D9  | A9  | E9  |     the turnaround: bar 12 hangs on the V
//
// and end it the classic way: B♭9 slid down a half step into A9, ringing.
//
// The lead is the B.B. King school: few notes, every one sung. Bends to the major 3rd (B → C♯) and to the root
// (G → A), held with a slow vibrato; blue-note curls (C → a quarter step sharp); slides into the 3rd. In bar 9 of the
// intro and bars 5 and 13 of the chorus, an Albert King move: a big bend held long, then released.

const BPM = 70;
/** A beat (a dotted quarter), a triplet eighth (the grid), a bar. Seconds. */
export const BEAT = 60 / BPM;
export const UNIT = BEAT / 3;
export const BAR = BEAT * 4;
/** Grid units to a bar. */
const B = 12;

/** Rory alone for this many bars, then the 12-bar chorus with Lulu, then the final chord. */
export const INTRO_BARS = 4;
export const CHORUS_BARS = 12;
/** When Lulu's first hit lands (seconds): the pickup triplet on the last beat of the intro. */
export const LULU_IN = (INTRO_BARS * B - 3) * UNIT;
/** When the final A9 lands (the B♭9 slides into it a triplet before) and how long it rings (seconds). */
export const FINAL_CHORD = (INTRO_BARS + CHORUS_BARS) * BAR;
export const RING = 3.2;

// 9th chords, as a blues player voices them on the middle strings (low to high, strummed down)
const A9 = ['A2', 'C#4', 'G4', 'B4'] as const;
const D9 = ['D3', 'F#3', 'C4', 'E4'] as const;
const E9 = ['E2', 'G#3', 'D4', 'F#4'] as const;
const Bb9 = ['A#2', 'D4', 'G#4', 'C5'] as const;

/** The chorus's changes, one chord a bar. */
const CHANGES = [A9, D9, A9, A9, D9, D9, A9, A9, E9, D9, A9, E9] as const;

/** A phrase, written bar by bar: `at` counts from the start of bar `bar`. */
const phrase = (bar: number, notes: readonly BluesNote[]): BluesNote[] =>
  notes.map(([at, note, len, touch]) => [bar * B + at, note, len, touch] as const);

const intro: BluesNote[] = [
  // bar 1: a pickup up the scale into B bent to C♯, held, the vibrato blooming
  ...phrase(0, [
    [6, 'E4', 1],
    [7, 'G4', 1],
    [8, 'A4', 1, { vib: 12 }],
    [9, 'B4', 4, { bend: 2, bendTime: 0.22, vib: 28 }],
  ]),
  // bar 2: down to the root, a blue curl on the C, slide into the 3rd, and home on the low A
  ...phrase(1, [
    [1, 'A4', 2, { vib: 22 }],
    [4, 'E4', 1],
    [5, 'C5', 1, { bend: 0.5, bendTime: 0.1 }],
    [6, 'A4', 1],
    [7, 'C#4', 1, { slideFrom: 'C4' }],
    [8, 'A3', 4, { vib: 25 }],
  ]),
  // bar 3: Albert: the D bent a whole step and held, singing, then a run down
  ...phrase(2, [
    [0, 'D5', 6, { bend: 2, bendTime: 0.3, vib: 30 }],
    [6, 'C5', 1, { bend: 0.5, bendTime: 0.08 }],
    [7, 'A4', 1],
    [8, 'C5', 1],
    [9, 'A4', 2, { vib: 22 }],
    [11, 'G4', 1],
  ]),
  // bar 4: an answer, then space: let the room breathe (and the drums come in)
  ...phrase(3, [
    [0, 'E4', 2],
    [2, 'G4', 1, { bend: 1, bendTime: 0.12 }],
    [3, 'A4', 4, { vib: 26 }],
  ]),
];

const chorus: BluesNote[] = [
  // 1 (A9)
  ...phrase(4, [
    [6, 'A4', 1],
    [7, 'C5', 1, { bend: 0.5, bendTime: 0.08 }],
    [8, 'A4', 1],
    [9, 'E4', 3, { vib: 22 }],
  ]),
  // 2 (D9): A bent to B, the 6th of D: sweet
  ...phrase(5, [
    [6, 'F#4', 1],
    [7, 'A4', 4, { bend: 2, bendTime: 0.2, vib: 26 }],
    [11, 'F#4', 1],
  ]),
  // 3 (A9): slide into C♯, then the B.B. bend again
  ...phrase(6, [
    [5, 'E5', 1],
    [6, 'C#5', 2, { slideFrom: 'C5', vib: 20 }],
    [8, 'A4', 1],
    [9, 'B4', 3, { bend: 2, bendTime: 0.2, vib: 28 }],
  ]),
  // 4 (A9): resolve, then a triplet run up into the IV
  ...phrase(7, [
    [0, 'A4', 3, { vib: 25 }],
    [6, 'G4', 1],
    [7, 'A4', 1],
    [8, 'C5', 1],
    [9, 'D5', 1, { bend: 2, bendTime: 0.1 }],
    [10, 'C5', 1],
    [11, 'A4', 1],
  ]),
  // 5 (D9): Albert: the D bent and held long, then picked bent and let down
  ...phrase(8, [
    [3, 'D5', 3, { bend: 2, bendTime: 0.32, vib: 32 }],
    [6, 'D5', 2, { release: 2 }],
    [8, 'C5', 1],
    [9, 'A4', 3, { vib: 25 }],
  ]),
  // 6 (D9)
  ...phrase(9, [
    [4, 'F#4', 1],
    [5, 'A4', 1],
    [6, 'B4', 1],
    [7, 'D5', 3, { vib: 26 }],
    [10, 'B4', 1],
    [11, 'A4', 1],
  ]),
  // 7 (A9)
  ...phrase(10, [
    [3, 'C#5', 3, { slideFrom: 'B4', vib: 22 }],
    [6, 'A4', 1],
    [7, 'G4', 1],
    [8, 'E4', 1],
    [9, 'G4', 3, { bend: 2, bendTime: 0.2, vib: 26 }],
  ]),
  // 8 (A9): the high E, three times, building
  ...phrase(11, [
    [0, 'A4', 2, { vib: 22 }],
    [6, 'E5', 1, { vel: 0.85 }],
    [7, 'E5', 1, { vel: 0.9 }],
    [8, 'E5', 1],
    [9, 'D5', 1, { bend: 2, bendTime: 0.1 }],
    [10, 'C5', 1],
    [11, 'A4', 1],
  ]),
  // 9 (E9): the V: G♯, the 3rd, slid into; B bent up and held, hard
  ...phrase(12, [
    [3, 'G#4', 3, { slideFrom: 'G4', vib: 25 }],
    [6, 'B4', 3, { bend: 2, bendTime: 0.24, vib: 32 }],
    [9, 'B4', 3, { vib: 22 }],
  ]),
  // 10 (D9): the IV, and down
  ...phrase(13, [
    [3, 'A4', 3, { bend: 2, bendTime: 0.22, vib: 26 }],
    [6, 'F#4', 2],
    [8, 'D4', 1],
    [9, 'E4', 3, { vib: 22 }],
  ]),
  // 11 (A9): the turnaround lick, in triplets, all the way down
  ...phrase(14, [
    [6, 'A4', 1],
    [7, 'G4', 1],
    [8, 'E4', 1],
    [9, 'C#4', 1, { slideFrom: 'C4' }],
    [10, 'A3', 1],
    [11, 'C4', 1],
  ]),
  // 12 (E9): on the V, a bent B, and the chord left hanging
  ...phrase(15, [[0, 'C#4', 3, { bend: 0.5, bendTime: 0.1, vib: 18 }]]),
];

/** The comping: a soft 9th chord on the one of each bar (and on the 3rd beat, now and then), the ending slide. */
const comping: BluesChord[] = [
  [0, A9, 4, 0.7], // the very first sound: an A9, letting the room know the key
  [B * 2 + 9, A9, 3, 0.45],
  ...CHANGES.map((chord, i): BluesChord => [(INTRO_BARS + i) * B, chord, 3, 0.55]),
  [(INTRO_BARS + 11) * B + 6, E9, 5, 0.75], // bar 12: on the V, hanging
  [(INTRO_BARS + 12) * B - 1, Bb9, 1, 0.9], // the ending: B♭9…
  [(INTRO_BARS + 12) * B, A9, Math.round(RING / UNIT), 1], // …into A9, ringing
];

export const guitar: BluesPart = { unit: UNIT, notes: [...intro, ...chorus], chords: comping };

/**
 * Lulu's slow shuffle. The drum grid's steps are a quarter of its beat; at 3/4 of our tempo, a step lasts a
 * third of our beat: our triplet eighth. So each bar of 12/8 is 12 characters:
 *   hi-hat on every triplet, the beat accented · kick on 1 and 3 · snare on 2 and 4, a ghost before 1
 * She comes in with a pickup (a snare triplet on the last beat of the intro), plays the chorus, fills into bar 12
 * on the toms, and hits the last chord with a crash.
 */
const SHUFFLE = {
  hat: 'xggxggxggxgg',
  kick: 'x.....x.....',
  snare: '...x.....x.g',
};
const REST = '.'.repeat(B);
const chorusBars = (pattern: string) => pattern.repeat(CHORUS_BARS - 1);
export const drums: DrumPart = {
  bpm: (BPM * 3) / 4,
  tracks: {
    // intro (silent but for the pickup), the chorus, then bar 12 with its fill, then the final hit
    hat: REST.repeat(INTRO_BARS) + chorusBars(SHUFFLE.hat) + 'xggxgg......' + REST,
    kick: REST.repeat(INTRO_BARS) + chorusBars(SHUFFLE.kick) + 'x.....x.....' + 'X' + REST.slice(1),
    snare: REST.repeat(INTRO_BARS - 1) + '.........gxX' + chorusBars(SHUFFLE.snare) + '...x........' + REST,
    tom: REST.repeat(INTRO_BARS + CHORUS_BARS - 1) + '.........xx.' + REST,
    floorTom: REST.repeat(INTRO_BARS + CHORUS_BARS - 1) + '...........x' + REST,
    crash: REST.repeat(INTRO_BARS + CHORUS_BARS) + 'X' + REST.slice(1),
  },
};
