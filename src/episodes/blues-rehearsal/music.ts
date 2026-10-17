import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import type { BluesChord, BluesNote, BluesPart } from '../../audio/blues-guitar';

// A slow blues in A, 12/8 at 70 (dotted-quarter) beats a minute: four beats a bar, each split in three (the
// shuffle's triplet feel), so the grid is triplet eighths, 12 to the bar. Rory plays four bars alone over A
// (rubato in spirit, laid back), Lulu sneaks in a pickup on the last beat of bar 4, and they play a 12-bar chorus
// together; Tiki Taka slips in during it and walks the bass under the second chorus:
//
//   | A9  | D9  | A9  | A9  |     the quick change to the IV in bar 2
//   | D9  | D9  | A9  | A9  |
//   | E9  | D9  | A9  | E9  |     the turnaround: bar 12 hangs on the V
//
// and end it the classic way after the second: B♭9 slid down a half step into A9, ringing.
//
// The lead is the B.B. King school: few notes, every one sung. Bends to the major 3rd (B → C♯) and to the root
// (G → A), held with a slow vibrato; blue-note curls (C → a quarter step sharp); slides into the 3rd. In bar 9 of the
// intro and bar 5 of the first chorus, an Albert King move: a big bend held long, then released. The second chorus
// climbs: up the neck, the bends bigger (a step and a half in bar 5), a climax on the V in bar 9, the turnaround.

const BPM = 70;
/** A beat (a dotted quarter), a triplet eighth (the grid), a bar. Seconds. */
export const BEAT = 60 / BPM;
export const UNIT = BEAT / 3;
export const BAR = BEAT * 4;
/** Grid units to a bar. */
const B = 12;

/** Rory alone for this many bars, then two 12-bar choruses (Lulu from the first, Tiki Taka from the second). */
export const INTRO_BARS = 4;
export const CHORUS_BARS = 12;
const CHORUSES = 2;
/** The bar the second chorus starts on (counting from 0). */
const SECOND = INTRO_BARS + CHORUS_BARS;
/** When Lulu's first hit lands (seconds): the pickup triplet on the last beat of the intro. */
export const LULU_IN = (INTRO_BARS * B - 3) * UNIT;
/** When Tiki Taka's first note lands: his pickup, on the last beat of the first chorus. */
export const TIKI_IN = (SECOND * B - 3) * UNIT;
/** When the final A9 lands (the B♭9 slides into it a triplet before) and how long it rings (seconds). */
export const FINAL_CHORD = (INTRO_BARS + CHORUSES * CHORUS_BARS) * BAR;
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

/** The second chorus: Rory, up the neck, hotter (bar numbers are the chorus's own, from 1). */
const second: BluesNote[] = [
  // 1 (A9): E bent up to F♯, held, picked bent and let down: Albert, singing over the new bass
  ...phrase(SECOND, [
    [0, 'E5', 3, { bend: 2, bendTime: 0.22, vib: 30 }],
    [3, 'E5', 2, { release: 2 }],
    [5, 'C#5', 1],
    [6, 'A4', 3, { vib: 24 }],
    [9, 'C#5', 1, { slideFrom: 'C5' }],
    [10, 'E5', 1],
    [11, 'G5', 1],
  ]),
  // 2 (D9)
  ...phrase(SECOND + 1, [
    [0, 'F#5', 3, { vib: 30 }],
    [3, 'E5', 1],
    [4, 'D5', 1],
    [5, 'C5', 1, { bend: 0.5, bendTime: 0.08 }],
    [6, 'A4', 4, { bend: 2, bendTime: 0.2, vib: 28 }],
    [10, 'F#4', 2],
  ]),
  // 3 (A9): the high A twice, then G bent to the root
  ...phrase(SECOND + 2, [
    [0, 'A5', 2, { vib: 26 }],
    [3, 'A5', 2, { vib: 26 }],
    [6, 'G5', 1],
    [7, 'E5', 1],
    [8, 'C#5', 1],
    [9, 'G5', 3, { bend: 2, bendTime: 0.2, vib: 30 }],
  ]),
  // 4 (A9): down, then a chromatic climb into the IV
  ...phrase(SECOND + 3, [
    [0, 'A5', 2, { vib: 24 }],
    [2, 'G5', 1],
    [3, 'E5', 1],
    [4, 'D5', 1],
    [5, 'C5', 1, { bend: 0.5, bendTime: 0.08 }],
    [6, 'A4', 2, { vib: 22 }],
    [8, 'C5', 1],
    [9, 'D5', 1],
    [10, 'D#5', 1],
    [11, 'E5', 1],
  ]),
  // 5 (D9): Albert's big one: D bent a step and a half, to the F (the ♯9 over D: tension), held, let down
  ...phrase(SECOND + 4, [
    [0, 'D5', 6, { bend: 3, bendTime: 0.36, vib: 34 }],
    [6, 'D5', 2, { release: 3 }],
    [8, 'C5', 1],
    [9, 'A4', 3, { vib: 26 }],
  ]),
  // 6 (D9): the C curled up toward C♯: the way back to A
  ...phrase(SECOND + 5, [
    [0, 'F#5', 2, { slideFrom: 'F5', vib: 26 }],
    [3, 'E5', 1],
    [4, 'D5', 1],
    [5, 'B4', 1],
    [6, 'C5', 3, { bend: 1, bendTime: 0.15, vib: 26 }],
    [9, 'A4', 3, { vib: 24 }],
  ]),
  // 7 (A9)
  ...phrase(SECOND + 6, [
    [0, 'C#5', 3, { slideFrom: 'C5', vib: 24 }],
    [3, 'E5', 1],
    [4, 'A5', 2, { vib: 28 }],
    [6, 'G5', 1, { bend: 2, bendTime: 0.12 }],
    [7, 'E5', 1],
    [8, 'C#5', 1],
    [9, 'A4', 3, { vib: 24 }],
  ]),
  // 8 (A9): a breath low, then a triplet run all the way up, to set up the V
  ...phrase(SECOND + 7, [
    [0, 'A3', 2],
    [2, 'C#4', 1, { slideFrom: 'C4' }],
    [3, 'E4', 1],
    [4, 'G4', 1],
    [5, 'A4', 1],
    [6, 'B4', 1],
    [7, 'C#5', 1],
    [8, 'E5', 1],
    [9, 'G5', 3, { vib: 28 }],
  ]),
  // 9 (E9): the climax: slide into G♯, B bent to C♯ (the 6th of E) and held, hard, then let down
  ...phrase(SECOND + 8, [
    [0, 'G#5', 3, { slideFrom: 'G5', vib: 30 }],
    [3, 'B5', 3, { bend: 2, bendTime: 0.22, vib: 34 }],
    [6, 'B5', 3, { release: 2 }],
    [9, 'G#5', 1],
    [10, 'E5', 1],
    [11, 'D5', 1],
  ]),
  // 10 (D9): coming down
  ...phrase(SECOND + 9, [
    [0, 'F#5', 3, { vib: 28 }],
    [3, 'D5', 1],
    [4, 'C5', 1],
    [5, 'A4', 1],
    [6, 'C5', 3, { bend: 0.5, bendTime: 0.1, vib: 24 }],
    [9, 'A4', 3, { vib: 24 }],
  ]),
  // 11 (A9): the turnaround, low
  ...phrase(SECOND + 10, [
    [0, 'A4', 3, { vib: 22 }],
    [6, 'G4', 1],
    [7, 'E4', 1],
    [8, 'C#4', 1, { slideFrom: 'C4' }],
    [9, 'A3', 1],
    [10, 'C4', 1, { bend: 0.5, bendTime: 0.08 }],
    [11, 'C#4', 1],
  ]),
  // 12 (E9): the last word, before the chord
  ...phrase(SECOND + 11, [[0, 'E4', 3, { vib: 22 }]]),
];

/** The comping: a soft 9th chord on the one of each bar (and on the 3rd beat, now and then), the ending slide. */
const comping: BluesChord[] = [
  [0, A9, 4, 0.7], // the very first sound: an A9, letting the room know the key
  [B * 2 + 9, A9, 3, 0.45],
  ...CHANGES.map((chord, i): BluesChord => [(INTRO_BARS + i) * B, chord, 3, 0.55]),
  [(INTRO_BARS + 11) * B + 6, E9, 5, 0.75], // bar 12: on the V, hanging (Tiki's cue)
  [(SECOND + 11) * B + 6, E9, 5, 0.75], // and at the end of the second
  [(SECOND + CHORUS_BARS) * B - 1, Bb9, 1, 0.9], // the ending: B♭9…
  [(SECOND + CHORUS_BARS) * B, A9, Math.round(RING / UNIT), 1], // …into A9, ringing
];

export const guitar: BluesPart = { unit: UNIT, notes: [...intro, ...chorus, ...second], chords: comping };

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
/** In the second chorus, with the bass in, she opens up: the hat swings the shuffle (long-short), a kick pickup. */
const OPEN_SHUFFLE = {
  hat: 'x.xx.xx.xx.x',
  kick: 'x.....x....g',
  snare: '...X.....X.g',
};
const REST = '.'.repeat(B);
/** A chorus's first 11 bars of a pattern. */
const chorusBars = (pattern: string) => pattern.repeat(CHORUS_BARS - 1);
export const drums: DrumPart = {
  bpm: (BPM * 3) / 4,
  tracks: {
    // intro (silent but for the pickup) · first chorus, bar 12 with its fill · second chorus, bar 12 · the last hit
    hat:
      REST.repeat(INTRO_BARS) +
      chorusBars(SHUFFLE.hat) +
      'xggxgg......' +
      chorusBars(OPEN_SHUFFLE.hat) +
      'x.xx.x......' +
      REST,
    kick:
      REST.repeat(INTRO_BARS) +
      chorusBars(SHUFFLE.kick) +
      'x.....x.....' +
      chorusBars(OPEN_SHUFFLE.kick) +
      'x.....x.....' +
      'X' +
      REST.slice(1),
    snare:
      REST.repeat(INTRO_BARS - 1) +
      '.........gxX' +
      chorusBars(SHUFFLE.snare) +
      '...x........' +
      chorusBars(OPEN_SHUFFLE.snare) +
      '...X........' +
      REST,
    tom: REST.repeat(SECOND - 1) + '.........xx.' + REST.repeat(CHORUS_BARS - 1) + '.........xxx' + REST,
    floorTom: REST.repeat(SECOND - 1) + '...........x' + REST.repeat(CHORUS_BARS - 1) + '..........xX' + REST,
    // a crash as Tiki Taka comes in, and on the last chord
    crash: REST.repeat(SECOND) + 'x' + REST.slice(1) + REST.repeat(CHORUS_BARS - 1) + 'X' + REST.slice(1),
  },
};

/** A bar of slow-blues walking bass on a chord: up root, 3rd, 5th, 6th, and the ♭7 as a pickup into the next. */
type Walk = readonly [root: string, third: string, fifth: string, sixth: string, seventh: string];
const walk = (bar: number, [root, third, fifth, sixth, seventh]: Walk) =>
  [
    [bar * B, root, 3],
    [bar * B + 3, third, 3],
    [bar * B + 6, fifth, 3],
    [bar * B + 9, sixth, 2],
    [bar * B + 11, seventh, 1, 0.8],
  ] as const;
const BASS_WALK: Record<'A' | 'D' | 'E', Walk> = {
  A: ['A1', 'C#2', 'E2', 'F#2', 'G2'],
  D: ['D2', 'F#2', 'A2', 'B2', 'C3'],
  E: ['E1', 'G#1', 'B1', 'C#2', 'D2'],
};
const BASS_CHANGES = ['A', 'D', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'] as const;

/**
 * Tiki Taka's bass, for the second chorus: a pickup up the E chord on the last beat of the first (G♯, B, then
 * the root), then a walking line, a bar a chord, and the ending: B♭ to A under the last chord. The bass grid is
 * eighth notes; at 3/2 of our tempo they fall on our triplet eighths.
 */
export const bass: BassPart = {
  bpm: (BPM * 3) / 2,
  notes: [
    [SECOND * B - 3, 'G#1', 1, 0.7],
    [SECOND * B - 2, 'B1', 1, 0.8],
    [SECOND * B - 1, 'D2', 1, 0.9],
    ...BASS_CHANGES.flatMap((chord, i) => walk(SECOND + i, BASS_WALK[chord])),
    [(SECOND + CHORUS_BARS) * B - 1, 'A#1', 1],
    [(SECOND + CHORUS_BARS) * B, 'A1', Math.round(RING / UNIT)],
  ],
};
