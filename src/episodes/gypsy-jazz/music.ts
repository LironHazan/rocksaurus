import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import { midi } from '../../audio/notes';
import { phrase, type GuitarChord, type LeadNote, type LeadPart } from '../../audio/lead-guitar';

// Gypsy jazz in G, the Django way: medium-up swing at 176, four beats a bar, each beat split in three (the swing's
// triplet feel), so the grid is triplet eighths, 12 to the bar. A swung eighth pair is long-short: 2 units, then 1.
//
// Lulu counts it in on her sticks; Rory sets up la pompe for four bars, the I–VI–ii–V that every manouche tune turns
// round on; then a 16-bar head, a 16-bar solo, and the first eight bars of the head again, into the ending:
//
//   A  | G6  | E7  | Am6 | D7  | G6  | E7  | Am6 D7 | G6 |
//   B  | G7  | G7  | C6  | Cm6 | G6  | E7  | Am6 D7 | G6 |     the bridge: up to the IV, and its minor 6 (the sigh)
//
// Under everything, la pompe: a chord on every beat, cut short, the 2 and 4 snapped harder (boom-CHICK). It's the
// drum kit of this music; Lulu's brushes and ride only sit on top of it. Tiki Taka plays in two (root, fifth) under
// the head, and walks four to the bar under the solo.
//
// The solo is Django's bag: arpeggios swept in triplets, a diminished arpeggio over the E7 (its ♭9), chromatic runs,
// octaves, tremolo picking on one note, enclosures. The ending is the classic one: A♭9 slid down into G6/9, ringing.

const BPM = 176;
/** A beat (a quarter), a triplet eighth (the grid), a bar. Seconds. */
export const BEAT = 60 / BPM;
export const UNIT = BEAT / 3;
export const BAR = BEAT * 4;
/** Grid units to a bar, and to a beat. */
const B = 12;
const Q = 3;

/** One bar of count-in, four of la pompe, the head, the solo, eight bars of the head out (its last is the ending). */
const COUNT_BARS = 1;
const INTRO_BARS = 4;
const CHORUS_BARS = 16;
const OUT_BARS = 8;
/** The bars (from 0) each section starts on. */
export const HEAD = COUNT_BARS + INTRO_BARS;
export const SOLO = HEAD + CHORUS_BARS;
export const OUT = SOLO + CHORUS_BARS;
/** When the final G6/9 lands (the A♭9 slides into it a triplet before) and how long it rings (seconds). */
export const FINAL_CHORD = (OUT + OUT_BARS) * BAR;
export const RING = 3.4;

// Gypsy voicings, low to high (strummed down): the 6th chords, never a plain triad
const CHORDS = {
  G6: ['G2', 'D3', 'E3', 'B3'],
  E7: ['E2', 'D3', 'G#3', 'B3'],
  Am6: ['A2', 'E3', 'F#3', 'C4'],
  D7: ['D3', 'A3', 'C4', 'F#4'],
  G7: ['G2', 'F3', 'B3', 'D4'],
  C6: ['C3', 'G3', 'A3', 'E4'],
  Cm6: ['C3', 'G3', 'A3', 'D#4'],
} as const;
type Chord = keyof typeof CHORDS;
const Ab9 = ['G#2', 'C4', 'F#4', 'A#4'] as const;
const G69 = ['G2', 'B2', 'E3', 'A3', 'D4'] as const;

/** A bar of the changes: one chord, or two (two beats each). */
type Bar = readonly [Chord] | readonly [Chord, Chord];
const INTRO: readonly Bar[] = [['G6'], ['E7'], ['Am6'], ['D7']];
const A: readonly Bar[] = [['G6'], ['E7'], ['Am6'], ['D7'], ['G6'], ['E7'], ['Am6', 'D7'], ['G6']];
const BRIDGE: readonly Bar[] = [['G7'], ['G7'], ['C6'], ['Cm6'], ['G6'], ['E7'], ['Am6', 'D7'], ['G6']];
const CHORUS = [...A, ...BRIDGE];
/** Every bar from the intro on, with the bar it starts on. */
const SONG: readonly (readonly [bar: number, chords: Bar])[] = [
  ...INTRO.map((b, i) => [COUNT_BARS + i, b] as const),
  ...CHORUS.map((b, i) => [HEAD + i, b] as const),
  ...CHORUS.map((b, i) => [SOLO + i, b] as const),
  ...A.map((b, i) => [OUT + i, b] as const),
];

/** A run of triplet eighths from `at` (units into the bar): the swept arpeggios and the chromatic runs. */
const triplets = (at: number, notes: readonly string[]): LeadNote[] =>
  notes.map((note, i) => [at + i, note, 1] as const);
/** Octaves: the note and the one above, picked together (thumb on the low one, Wes before Wes). */
const octave = (at: number, note: string, len: number): LeadNote[] => {
  const n = midi(note);
  return [
    [at, note, len],
    [at, noteName(n + 12), len, { vib: 10 }],
  ];
};
/** Tremolo: one note picked as fast as the hand goes (sextuplets, half a unit each) for `len` units. */
const tremolo = (at: number, note: string, len: number): LeadNote[] =>
  Array.from({ length: len * 2 }, (_, i) => [at + i / 2, note, 0.5, { vel: i % 2 ? 0.7 : 0.9 }] as const);

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
/** Semitones to an octave. */
const OCTAVE = 12;
/** 55 → 'G3'. */
const noteName = (m: number) => `${NAMES[m % OCTAVE]!}${Math.floor(m / OCTAVE) - 1}`;

/** The head: a swing melody over the changes. The A's first eight bars come back as the head out. */
const headA = (bar: number): LeadNote[] => [
  ...phrase(bar, [
    [0, 'D5', 2],
    [2, 'E5', 1],
    [3, 'G5', 6, { vib: 14 }],
    [9, 'E5', 2],
    [11, 'D5', 1],
  ]),
  // E7: up its diminished arpeggio (G♯ B D F: the ♭9 is the gypsy sound), then home to E
  ...phrase(bar + 1, [
    [0, 'G#4', 2],
    [2, 'B4', 1],
    [3, 'D5', 2],
    [5, 'F5', 1],
    [6, 'E5', 3, { vib: 12 }],
    [9, 'D5', 2],
    [11, 'B4', 1],
  ]),
  ...phrase(bar + 2, [
    [0, 'C5', 2],
    [2, 'E5', 1],
    [3, 'A5', 5, { vib: 16 }],
    [9, 'F#5', 2],
    [11, 'E5', 1],
  ]),
  ...phrase(bar + 3, [
    [0, 'F#5', 2],
    [2, 'A5', 1],
    [3, 'C6', 2],
    [5, 'A5', 1],
    [6, 'F#5', 2],
    [8, 'D5', 1],
    [9, 'C5', 2],
    [11, 'A4', 1],
  ]),
  ...phrase(bar + 4, [
    [0, 'B4', 6, { vib: 14 }],
    [6, 'D5', 2],
    [8, 'E5', 1],
    [9, 'G5', 2],
    [11, 'A5', 1],
  ]),
  // E7: down the diminished arpeggio in triplets, from the top
  ...phrase(bar + 5, [...triplets(0, ['B5', 'G#5', 'F5', 'D5', 'B4', 'G#4']), [6, 'E5', 5, { vib: 14 }]]),
  ...phrase(bar + 6, [
    [0, 'A4', 2],
    [2, 'C5', 1],
    [3, 'E5', 3],
    [6, 'D5', 2],
    [8, 'F#5', 1],
    [9, 'A5', 2],
    [11, 'C6', 1],
  ]),
];

const head: LeadNote[] = [
  ...headA(HEAD),
  ...phrase(HEAD + 7, [
    [0, 'B5', 2],
    [2, 'A5', 1],
    [3, 'G5', 6, { vib: 18 }],
  ]),
  // the bridge: G7 slid into its 7th, down the arpeggio…
  ...phrase(HEAD + 8, [
    [0, 'F5', 6, { slideFrom: 'E5', vib: 14 }],
    [6, 'D5', 2],
    [8, 'B4', 1],
    [9, 'G4', 2],
    [11, 'F4', 1],
  ]),
  ...phrase(HEAD + 9, [
    [0, 'B4', 2],
    [2, 'D5', 1],
    [3, 'F5', 2],
    [5, 'A5', 1],
    [6, 'G5', 3],
    [9, 'F5', 2],
    [11, 'D5', 1],
  ]),
  // …C6, bright; then Cm6, the same shape with its 3rd let down: the sigh
  ...phrase(HEAD + 10, [
    [0, 'E5', 6, { vib: 16 }],
    [6, 'G5', 2],
    [8, 'A5', 1],
    [9, 'C6', 3, { vib: 12 }],
  ]),
  ...phrase(HEAD + 11, [
    [0, 'D#5', 6, { vib: 18 }],
    [6, 'C5', 2],
    [8, 'A4', 1],
    [9, 'G4', 3],
  ]),
  ...phrase(HEAD + 12, [
    [0, 'B4', 2],
    [2, 'D5', 1],
    [3, 'E5', 2],
    [5, 'G5', 1],
    [6, 'B5', 6, { vib: 18 }],
  ]),
  ...phrase(HEAD + 13, [
    [0, 'G#5', 2],
    [2, 'F5', 1],
    [3, 'D5', 2],
    [5, 'B4', 1],
    [6, 'G#4', 2],
    [8, 'B4', 1],
    [9, 'D5', 2],
    [11, 'F5', 1],
  ]),
  ...phrase(HEAD + 14, [
    [0, 'E5', 3],
    [3, 'C5', 3],
    [6, 'D5', 2],
    [8, 'C5', 1],
    [9, 'A4', 2],
    [11, 'F#4', 1],
  ]),
  // home, and a pickup into the solo: up the G6 in triplets
  ...phrase(HEAD + 15, [[0, 'G4', 6, { vib: 14 }], ...triplets(9, ['B4', 'D5', 'E5'])]),
];

const solo: LeadNote[] = [
  // G6: swept up two octaves of the arpeggio, and the high D sung
  ...phrase(SOLO, [
    ...triplets(0, ['G4', 'B4', 'D5', 'E5', 'G5', 'B5']),
    [6, 'D6', 3, { vib: 16 }],
    [9, 'B5', 2],
    [11, 'A5', 1],
  ]),
  // E7: the diminished run, all the way down, and back up to land on D (its 7th)
  ...phrase(SOLO + 1, [
    ...triplets(0, ['F5', 'D5', 'B4', 'G#4', 'F4', 'D4']),
    [6, 'E4', 2],
    [8, 'G#4', 1],
    [9, 'B4', 2],
    [11, 'D5', 1],
  ]),
  // Am6: up its arpeggio to an enclosure: the note above, the note below, then the A
  ...phrase(SOLO + 2, [
    [0, 'C5', 2],
    [2, 'E5', 1],
    [3, 'F#5', 2],
    [5, 'B5', 1],
    [6, 'G#5', 1],
    [7, 'A5', 5, { vib: 16 }],
  ]),
  // D7: chromatic, down from the top
  ...phrase(SOLO + 3, [
    ...triplets(0, ['D6', 'C#6', 'C6', 'B5', 'A#5', 'A5']),
    [6, 'F#5', 2],
    [8, 'D5', 1],
    [9, 'C5', 2],
    [11, 'A4', 1],
  ]),
  // G6, E7: octaves
  ...phrase(SOLO + 4, [...octave(0, 'B3', 2), ...octave(3, 'D4', 2), ...octave(6, 'E4', 2), ...octave(9, 'G4', 3)]),
  ...phrase(SOLO + 5, [...octave(0, 'G#4', 3), ...octave(3, 'F4', 3), ...octave(6, 'E4', 6)]),
  // Am6, D7: triplet arpeggios, up and down each
  ...phrase(SOLO + 6, triplets(0, ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'D5', 'F#5', 'A5', 'C6', 'A5', 'F#5'])),
  ...phrase(SOLO + 7, [
    [0, 'G5', 6, { vib: 18 }],
    [6, 'D5', 2],
    [8, 'E5', 1],
    [9, 'F5', 2],
    [11, 'F#5', 1],
  ]),
  // the bridge: tremolo on the G7's top, then down its arpeggio…
  ...phrase(SOLO + 8, [...tremolo(0, 'G5', 6), [6, 'F5', 2], [8, 'D5', 1], [9, 'B4', 2], [11, 'G4', 1]]),
  // …and up the G♯ diminished (G7♭9), two octaves
  ...phrase(SOLO + 9, [
    ...triplets(0, ['G#4', 'B4', 'D5', 'F5', 'G#5', 'B5']),
    [6, 'D6', 3, { vib: 18 }],
    [9, 'B5', 2],
    [11, 'G#5', 1],
  ]),
  ...phrase(SOLO + 10, [
    [0, 'A5', 2],
    [2, 'G5', 1],
    [3, 'E5', 2],
    [5, 'C5', 1],
    [6, 'E5', 3],
    [9, 'G5', 2],
    [11, 'A5', 1],
  ]),
  ...phrase(SOLO + 11, [
    [0, 'D#5', 3, { vib: 16 }],
    [3, 'C5', 2],
    [5, 'A4', 1],
    [6, 'D#5', 2],
    [8, 'G5', 1],
    [9, 'A5', 3, { vib: 16 }],
  ]),
  // G6: the big sweep, to the top of the neck…
  ...phrase(SOLO + 12, [...triplets(0, ['G4', 'B4', 'D5', 'G5', 'B5', 'D6']), [6, 'E6', 6, { vib: 20 }]]),
  // …and the chromatic run, all the way down, a triplet a semitone
  ...phrase(SOLO + 13, triplets(0, ['E6', 'D#6', 'D6', 'C#6', 'C6', 'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5'])),
  ...phrase(SOLO + 14, [
    [0, 'E5', 2],
    [2, 'C5', 1],
    [3, 'A4', 2],
    [5, 'C5', 1],
    [6, 'D5', 2],
    [8, 'F#5', 1],
    [9, 'A5', 2],
    [11, 'C6', 1],
  ]),
  ...phrase(SOLO + 15, [
    [0, 'B5', 3],
    [3, 'G5', 6, { vib: 18 }],
  ]),
];

/** The head out, and the ending: up the G6/9 in triplets on the last bar, waiting for the chord. */
const out: LeadNote[] = [
  ...headA(OUT),
  ...phrase(OUT + 7, [...triplets(0, ['G4', 'B4', 'D5', 'E5', 'G5', 'A5']), [6, 'B5', 5, { vib: 18 }]]),
];

/** Chord-strum levels: la pompe on its own (the intro), and under the lead. */
const POMPE = { alone: 1, under: 0.45 } as const;

/** La pompe for one bar: a chord on every beat, cut short; 2 and 4 shorter still and snapped harder (boom-CHICK). */
function pompe(bar: number, [first, second = first]: Bar, level: number): GuitarChord[] {
  return [0, 1, 2, 3].map(beat => {
    const chick = beat % 2 === 1;
    return [bar * B + beat * Q, CHORDS[beat < 2 ? first : second], chick ? 1 : 2, level * (chick ? 1 : 0.7)] as const;
  });
}

const rhythm: GuitarChord[] = [
  ...SONG.flatMap(([bar, chords]) =>
    bar < OUT + OUT_BARS - 1 ? pompe(bar, chords, bar < HEAD ? POMPE.alone : POMPE.under) : [],
  ),
  // the ending: the last bar's first two beats, then A♭9 sliding into G6/9
  ...pompe(OUT + OUT_BARS - 1, ['G6'], POMPE.under).slice(0, 2),
  [(OUT + OUT_BARS) * B - 1, Ab9, 1, 0.9],
  [(OUT + OUT_BARS) * B, G69, Math.round(RING / UNIT), 1],
];

export const guitar: LeadPart = { unit: UNIT, notes: [...head, ...solo, ...out], chords: rhythm };

/**
 * Lulu's kit, brushes-quiet. The drum grid's steps are a quarter of its beat; at 3/4 of our tempo, a step lasts a
 * third of our beat: our triplet eighth. So each bar is 12 characters:
 *   ride: the swing's spang-spang-a-lang (1, 2 and its swung "and", 3, 4 and its) · hi-hat foot on 2 and 4 ·
 *   kick feathered on all four, barely there · snare: a ghost or two, comping
 * She counts in on her sticks, keeps to the hat and the kick under the intro, and plays a fill into the solo.
 */
const GROOVE = {
  ride: 'x..x.xx..x.x',
  hat: '...x.....x..',
  kick: 'g..g..g..g..',
  snare: '.....g.....g',
};
/** Under the solo she leans in: the ride accented on 1 and 3, the snare comping more. */
const SOLO_GROOVE = { ...GROOVE, ride: 'X..x.xX..x.x', snare: '..g..g..gg.g' };
const REST = '.'.repeat(B);
const bars = (pattern: string, n: number) => pattern.repeat(n);

/** One track through the song: count-in, intro, head (its last bar a fill), solo, head out, the ending. */
function track(
  name: keyof typeof GROOVE,
  { intro, fill, ending, last }: { intro: string; fill: string; ending: string; last: string },
): string {
  return (
    REST +
    bars(intro, INTRO_BARS) +
    bars(GROOVE[name], CHORUS_BARS - 1) +
    fill +
    bars(SOLO_GROOVE[name], CHORUS_BARS) +
    bars(GROOVE[name], OUT_BARS - 1) +
    ending +
    last
  );
}
const LAST_HIT = 'X' + REST.slice(1);

export const drums: DrumPart = {
  bpm: (BPM * 3) / 4,
  tracks: {
    click: 'x..x..x..x..', // the count-in: one, two, one-two-three-four
    ride: track('ride', { intro: REST, fill: 'x..x........', ending: 'x..x.x......', last: REST }),
    hat: track('hat', { intro: GROOVE.hat, fill: '...x........', ending: '...x........', last: REST }),
    kick: track('kick', { intro: GROOVE.kick, fill: 'g..g........', ending: 'g..g.....g..', last: LAST_HIT }),
    snare: track('snare', { intro: REST, fill: '......gxgxxX', ending: '......g.gxx.', last: REST }),
    crash: REST.repeat(SOLO) + LAST_HIT + REST.repeat(OUT + OUT_BARS - SOLO - 1) + LAST_HIT,
  },
};

/** A chord's bass notes: root, 3rd, 5th (in the bass's octave). */
const BASS_TONES: Record<Chord, readonly [root: string, third: string, fifth: string]> = {
  G6: ['G1', 'B1', 'D2'],
  E7: ['E2', 'G#2', 'B1'],
  Am6: ['A1', 'C2', 'E2'],
  D7: ['D2', 'F#2', 'A1'],
  G7: ['G1', 'B1', 'D2'],
  C6: ['C2', 'E2', 'G2'],
  Cm6: ['C2', 'D#2', 'G2'],
};
/** The note a semitone below `note`: the chromatic approach into the next bar's root. */
const below = (note: string) => noteName(midi(note) - 1);
const rootOf = (bars: readonly (readonly [number, Bar])[], i: number) => BASS_TONES[bars[i]?.[1][0] ?? 'G6'][0];

type BassNote = BassPart['notes'][number];
/** In two: root and fifth, a half note each (or the two chords' roots). */
function inTwo(bar: number, [first, second]: Bar): BassNote[] {
  const [root, , fifth] = BASS_TONES[first];
  return [
    [bar * B, root, 5],
    [bar * B + 2 * Q, second ? BASS_TONES[second][0] : fifth, 5, 0.85],
  ];
}
/** Under the solo the bass steps back: Rory's lead sits on top. */
const UNDER_SOLO = 0.7;
/** Walking four: root, 3rd, 5th, then a semitone below where the next bar starts (with two chords: root, 5th each). */
function walking(bar: number, [first, second]: Bar, next: string): BassNote[] {
  const [root, third, fifth] = BASS_TONES[first];
  const line = second ? [root, fifth, BASS_TONES[second][0], below(next)] : [root, third, fifth, below(next)];
  return line.map((note, beat) => [bar * B + beat * Q, note, 2, UNDER_SOLO * (beat % 2 ? 0.8 : 1)] as const);
}

/**
 * Tiki Taka's bass. The bass grid is eighth notes; at 3/2 of our tempo they fall on our triplet eighths. In two
 * under the intro and the heads, walking under the solo, and the ending: A♭ to G under the last chord.
 */
export const bass: BassPart = {
  bpm: (BPM * 3) / 2,
  notes: [
    ...SONG.flatMap(([bar, chords], i) =>
      bar >= SOLO && bar < OUT ? walking(bar, chords, rootOf(SONG, i + 1)) : inTwo(bar, chords),
    ).filter(([at]) => at < (OUT + OUT_BARS) * B - Q),
    [(OUT + OUT_BARS) * B - 1, 'G#1', 1],
    [(OUT + OUT_BARS) * B, 'G1', Math.round(RING / UNIT)],
  ],
};
