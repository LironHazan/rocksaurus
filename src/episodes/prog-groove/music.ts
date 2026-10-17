import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import type { Riff, RiffNote } from '../../audio/guitar';
import type { KeyboardPart, KeyNote } from '../../audio/keyboard-part';
import type { SungNote, VocalPart } from '../../audio/vowels';

// Progressive metal in D, drop-D, the Tool / Soen way: a hypnotic riff in 7/8 that the bass owns, tribal toms, a
// half-time verse that leaves room for a soft, ominous vocal, a build where the guitar plays five over the drums'
// four, a chorus that opens up and soars, the riff one last time, and everyone landing on one D.
// 92 BPM; everything counts in eighths (0.33 s). 7/8 bars group 2+2+3.
//
//   bass alone   2 × 7/8   the riff, Tiki Taka on his own
//   drums in     2 × 7/8   Lulu joins on the toms
//   groove       4 × 7/8   everyone: the riff on drop-D guitar, the bass, Steggy's pad
//   verse        4 × 4/4   Dm | B♭ | Gm | A     Paris, half time, the guitar chugging 3+3+2
//   build        2 × 4/4   the guitar's five-eighth cell over straight four (it comes round in bar 3)
//   chorus       4 × 4/4   B♭ | F | C | Dm     open chords, Paris high
//   outro        2 × 7/8   the riff
//   the end      1 × 4/4   one D, everyone, ringing

const BPM = 92;
/** A beat and an eighth, seconds. */
export const BEAT = 60 / BPM;
export const EIGHTH = BEAT / 2;

/** Eighths to a bar of 7/8 and of 4/4. */
const SEVEN = 7;
const FOUR = 8;
/** Where each section starts, in eighths. */
export const AT = {
  bassAlone: 0,
  drumsIn: 2 * SEVEN,
  groove: 4 * SEVEN,
  verse: 8 * SEVEN,
  build: 8 * SEVEN + 4 * FOUR,
  chorus: 8 * SEVEN + 6 * FOUR,
  outro: 8 * SEVEN + 10 * FOUR,
  end: 10 * SEVEN + 10 * FOUR,
} as const;
/** The last D: how long it rings (eighths). */
const RING = 8;
export const END_OF_SONG = (AT.end + RING) * EIGHTH;

/** The riff: one 7/8 bar and its answer, [eighth in the bar, note, length]. The bass plays it as written. */
type Cell = readonly (readonly [at: number, note: string, len: number])[];
const RIFF: Cell = [
  [0, 'D2', 1],
  [1, 'D2', 0.5],
  [1.5, 'F2', 0.5],
  [2, 'A2', 1],
  [3, 'G2', 0.5],
  [3.5, 'F2', 0.5],
  [4, 'D2', 1],
  [5, 'C3', 1],
  [6, 'A2', 1],
];
const ANSWER: Cell = [
  [0, 'D2', 1],
  [1, 'D2', 0.5],
  [1.5, 'F2', 0.5],
  [2, 'A2', 1],
  [3, 'G2', 0.5],
  [3.5, 'F2', 0.5],
  [4, 'E2', 0.5],
  [4.5, 'F2', 0.5],
  [5, 'G2', 0.5],
  [5.5, 'A2', 0.5],
  [6, 'C3', 1],
];
/** The riff and its answer, `pairs` times from `at`, as [eighth, note, length]. */
const riff = (at: number, pairs: number) =>
  Array.from({ length: pairs * 2 }, (_, i) =>
    (i % 2 ? ANSWER : RIFF).map(([off, note, len]) => [at + i * SEVEN + off, note, len] as const),
  ).flat();
/** The guitar's five-eighth cell in the build: it starts somewhere new against the drums' four every time. */
const FIVE: Cell = [
  [0, 'D2', 1],
  [1, 'D2', 0.5],
  [1.5, 'D2', 0.5],
  [2, 'F2', 1],
  [3, 'D2', 1],
  [4, 'G#2', 1],
];
const fives = (at: number, times: number) =>
  Array.from({ length: times }, (_, i) =>
    FIVE.map(([off, note, len]) => [at + i * 5 + off, note, len] as const),
  ).flat();

type Chord = 'Dm' | 'Bb' | 'Gm' | 'A' | 'F' | 'C';
const VERSE: readonly Chord[] = ['Dm', 'Bb', 'Gm', 'A'];
const CHORUS: readonly Chord[] = ['Bb', 'F', 'C', 'Dm'];
/** Each chord's root for the drop-D guitar and the bass, and the pad's voicing. */
const ROOT: Record<Chord, string> = { Dm: 'D2', Bb: 'A#1', Gm: 'G1', A: 'A1', F: 'F2', C: 'C2' };
const PAD: Record<Chord, readonly string[]> = {
  Dm: ['D3', 'A3', 'D4', 'F4'],
  Bb: ['A#2', 'F3', 'A#3', 'D4'],
  Gm: ['G2', 'D3', 'G3', 'A#3'],
  A: ['A2', 'E3', 'A3', 'C#4'],
  F: ['F2', 'C3', 'F3', 'A3'],
  C: ['C3', 'G3', 'C4', 'E4'],
};
/** Bars of a progression from `at`, with the eighth each starts on. */
const bars = (at: number, chords: readonly Chord[]) => chords.map((c, i) => [at + i * FOUR, c] as const);
/** The 3+3+2 inside a bar of four: where the accents fall. */
const PUSH = [0, 3, 6] as const;
/** Up an octave: the guitar's chords sit an octave over the bass's roots (the drop-D low D is D2). */
const up = (note: string) => note.replace(/\d$/, o => String(Number(o) + 1));

export const guitar: Riff = {
  bpm: BPM,
  notes: [
    ...riff(AT.groove, 2).map(([at, note, len]): RiffNote => [at, note, len, len < 1 ? 'mute' : 'open', 0.7]),
    // the verse: palm-muted chugs on the 3+3+2, the accents let ring, quiet under the voice
    ...bars(AT.verse, VERSE).flatMap(([b, c]) =>
      Array.from({ length: FOUR }, (_, e): RiffNote => {
        const accent = PUSH.some(p => p === e);
        return [b + e, up(ROOT[c]), 1, accent ? 'open' : 'mute', accent ? 0.45 : 0.3];
      }),
    ),
    ...fives(AT.build, 3).map(([at, note, len]): RiffNote => [at, note, len, len < 1 ? 'mute' : 'open', 0.7]),
    [AT.build + 15, 'A2', 1, 'open', 0.8], // the pickup into the chorus
    // the chorus: big open chords on the 3+3+2
    ...bars(AT.chorus, CHORUS).flatMap(([b, c]) =>
      PUSH.map((p, i): RiffNote => [b + p, up(ROOT[c]), i === 2 ? 2 : 3, 'open', 0.75]),
    ),
    ...riff(AT.outro, 1).map(([at, note, len]): RiffNote => [at, note, len, len < 1 ? 'mute' : 'open', 0.8]),
    [AT.end, 'D2', RING, 'open', 0.9],
  ],
};

export const bass: BassPart = {
  bpm: BPM,
  notes: [
    ...riff(AT.bassAlone, 4).map(([at, note, len]) => [at, note, len * 0.95, 0.85] as const),
    ...bars(AT.verse, VERSE).flatMap(([b, c]) =>
      PUSH.map((p, i) => [b + p, ROOT[c], i === 2 ? 1.9 : 2.9, 0.8] as const),
    ),
    ...fives(AT.build, 3).map(([at, note, len]) => [at, note.replace('2', '1'), len * 0.95, 0.85] as const),
    [AT.build + 15, 'A1', 1, 0.8],
    // the chorus: driving eighths on the root
    ...bars(AT.chorus, CHORUS).flatMap(([b, c]) =>
      Array.from({ length: FOUR }, (_, e) => [b + e, ROOT[c], 0.9, e % 2 ? 0.7 : 0.85] as const),
    ),
    ...riff(AT.outro, 1).map(([at, note, len]) => [at, note, len * 0.95, 0.9] as const),
    [AT.end, 'D1', RING, 1],
  ],
};

/** Steggy: a dark pad under the groove, the verse and the chorus; a high, cold synth line in the build. */
export const pad: KeyboardPart = {
  bpm: BPM,
  sound: 'pad',
  gain: 0.8,
  notes: [
    ...PAD.Dm.map((n): KeyNote => [AT.groove, n, 4 * SEVEN, 0.4, 'L']),
    ...bars(AT.verse, VERSE).flatMap(([b, c]) => PAD[c].map((n): KeyNote => [b, n, FOUR, 0.45, 'L'])),
    ...PAD.Dm.map((n): KeyNote => [AT.build, n, 2 * FOUR, 0.4, 'L']),
    ...bars(AT.chorus, CHORUS).flatMap(([b, c]) => PAD[c].map((n): KeyNote => [b, n, FOUR, 0.5, 'L'])),
    ...PAD.Dm.map((n): KeyNote => [AT.end, n, RING, 0.5, 'L']),
  ],
};
/** The build's synth: a five-note figure in quarter notes, up and down the D minor with a G♯ in it (the tritone). */
const CHILL = ['D5', 'A5', 'G#5', 'F5', 'E5'] as const;
export const lead: KeyboardPart = {
  bpm: BPM,
  sound: 'lead',
  gain: 0.5,
  notes: Array.from({ length: 8 }, (_, i): KeyNote => [AT.build + i * 2, CHILL[i % CHILL.length]!, 1.8, 0.6, 'R']),
};

/** A sung phrase from `at`: each note follows the last. */
const sung = (at: number, notes: readonly (readonly [note: string, len: number, vowel?: SungNote[3]])[]) => {
  let next = at;
  return notes.map(([note, len, vowel = 'a']): SungNote => {
    const n: SungNote = [next, note, len, vowel, 0.75];
    next += len;
    return n;
  });
};

/** Paris: low and ominous in the verse, then up an octave for the chorus. */
export const vocal: VocalPart = {
  bpm: BPM,
  notes: [
    ...sung(AT.verse, [
      ['A4', 2],
      ['D5', 2, 'o'],
      ['C5', 1, 'e'],
      ['A4', 3],
    ]),
    ...sung(AT.verse + FOUR, [
      ['F4', 2, 'u'],
      ['G4', 1],
      ['A4', 1],
      ['A#4', 4, 'o'],
    ]),
    ...sung(AT.verse + 2 * FOUR, [
      ['D5', 2],
      ['C5', 1, 'e'],
      ['A#4', 1],
      ['A4', 2],
      ['G4', 2, 'o'],
    ]),
    ...sung(AT.verse + 3 * FOUR, [
      ['A4', 2, 'e'],
      ['C#5', 2],
      ['E5', 4],
    ]),
    ...sung(AT.chorus, [
      ['F5', 3, 'o'],
      ['D5', 1],
      ['F5', 2],
      ['G5', 2],
    ]),
    ...sung(AT.chorus + FOUR, [
      ['A5', 4],
      ['G5', 2, 'e'],
      ['F5', 2],
    ]),
    ...sung(AT.chorus + 2 * FOUR, [
      ['E5', 2, 'o'],
      ['F5', 2, 'e'],
      ['G5', 4],
    ]),
    ...sung(AT.chorus + 3 * FOUR, [
      ['A5', 5],
      ['F5', 1, 'e'],
      ['D5', 2, 'o'],
    ]),
    [AT.end, 'D5', RING, 'a', 0.8],
  ],
};

/**
 * Lulu, Danny Carey style: tribal toms to come in, the riff's 2+2+3 on the kick and snare, a half-time verse with
 * ghost notes, straight four under the guitar's fives, double kick in the chorus. Sixteenths: a 7/8 bar is 14
 * steps, a 4/4 bar 16.
 */
const SILENT = { seven: '.'.repeat(2 * SEVEN), four: '.'.repeat(2 * FOUR) };
interface Section {
  /** How many bars, whether they're 7/8, and each drum's bars: the patterns cycle through the section. */
  bars: number;
  seven: boolean;
  tracks: Partial<Record<Drum, readonly string[]>>;
}
const KIT = ['kick', 'snare', 'hat', 'ride', 'tom', 'floorTom', 'crash', 'china'] as const;
type Drum = (typeof KIT)[number];
const SECTIONS: readonly Section[] = [
  { bars: 2, seven: true, tracks: {} },
  {
    bars: 2,
    seven: true,
    tracks: {
      kick: ['x.......x.....'],
      tom: ['..x.x.....x.x.'],
      floorTom: ['x.....x.x...xx', 'x.....x.x.....'],
      snare: ['..............', '..........gxXX'],
    },
  },
  {
    bars: 4,
    seven: true,
    tracks: {
      kick: ['x.....x.x.....'],
      snare: ['....X.......X.'],
      hat: ['x.x.x.x.x.x.x.'],
      china: ['X.............', '..............', 'X.............', '..............'],
    },
  },
  {
    bars: 4,
    seven: false,
    tracks: {
      kick: ['x.....x...x.....'],
      snare: ['..g.....X..g....'],
      hat: ['x.x.x.x.x.x.x.x.'],
      crash: ['x...............', '................', '................', '................'],
    },
  },
  {
    bars: 2,
    seven: false,
    tracks: {
      kick: ['x.........x.....', '....x.........x.'],
      snare: ['....X.......X...', '....X.......X...'],
      hat: ['x.x.x.x.x.x.x.x.', 'x.x.x.x.........'],
      tom: ['................', '........xx......'],
      floorTom: ['................', '..........xxxxXX'],
    },
  },
  {
    bars: 4,
    seven: false,
    tracks: {
      kick: ['x.x.x.x.x.x.x.x.'],
      snare: ['....X.......X...'],
      ride: ['x.x.x.x.x.x.x.x.'],
      crash: ['X...............', '................', 'X...............', '................'],
      china: ['................', '............X...', '................', '..........X.X.X.'],
    },
  },
  {
    bars: 2,
    seven: true,
    tracks: {
      kick: ['x.....x.x.....'],
      snare: ['....X.......X.'],
      china: ['X.............'],
      floorTom: ['..............', '..........xxxx'],
    },
  },
  {
    bars: 1,
    seven: false,
    tracks: { kick: ['X...............'], crash: ['X...............'], china: ['X...............'] },
  },
];
/** One drum through the whole song: each section's patterns cycled over its bars, else silence. */
function drumTrack(name: Drum): string {
  return SECTIONS.map(({ bars: n, seven, tracks }) => {
    const p = tracks[name] ?? [seven ? SILENT.seven : SILENT.four];
    return Array.from({ length: n }, (_, i) => p[i % p.length]!).join('');
  }).join('');
}
export const drums: DrumPart = {
  bpm: BPM,
  tracks: Object.fromEntries(KIT.map(k => [k, drumTrack(k)])),
};
