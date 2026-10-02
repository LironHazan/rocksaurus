import type { DrumPart } from '../../audio/drum-patterns';
import type { KeyboardPart, KeyNote } from '../../audio/keyboard-part';
import type { SungNote, VocalPart } from '../../audio/vowels';
import type { Activity } from '../../band/types';

// "Rocksaurus Live" — prog rock in E Dorian (bright minor) with a major-key chorus.
// 120 BPM: 1 eighth = 0.25 s. Bars mix 4/4 (8 eighths) and 7/8 (7 eighths, grouped 2+2+3).
export const BPM = 120;
export const BEAT = 60 / BPM;
const E = 60 / BPM / 2; // seconds per eighth

/** Where each section starts, in eighths. */
const AT = {
  countIn: 0, // 1 bar 4/4
  intro: 8, // 2 bars 7/8 — unison riff
  verse: 22, // 4 bars 4/4 — Em7 | A | Em7 | A
  brk: 54, // 2 bars 7/8 — organ run over the riff
  chorus: 68, // 3 bars 4/4 — G | D | A (the lift)
  ending: 92, // 1 bar 4/4 — E major
  end: 100,
} as const;
/** Section start times in seconds (for the camera and the performers). */
export const T = Object.fromEntries(Object.entries(AT).map(([k, v]) => [k, v * E])) as Record<keyof typeof AT, number>;
export const DURATION = T.end;
export const ENDING_AT = T.ending;

export function bandActivity(t: number): Activity {
  if (t >= ENDING_AT + 0.3) return 'pose';
  return t >= T.intro ? 'play' : 'idle';
}
export const drummerActivity = bandActivity;

// ---------- the riff (7/8, 2+2+3), played in unison by guitar, bass and organ ----------
/** [eighth offset in the bar, note, length] for one 7/8 bar; `octave` shifts it for each instrument. */
const RIFF_A: readonly [number, string, number][] = [
  [0, 'E', 1],
  [1, 'E', 1],
  [2, 'G', 1],
  [3, 'A', 1],
  [4, 'B', 1],
  [5, 'D', 1],
  [6, 'C#', 1],
];
const RIFF_B: readonly [number, string, number][] = [
  [0, 'E', 1],
  [1, 'E', 1],
  [2, 'G', 1],
  [3, 'A', 1],
  [4, 'B', 0.5],
  [4.5, 'C#', 0.5],
  [5, 'D', 1],
  [6, 'E', 1],
];
/** Octave of each riff note so the line climbs naturally: notes after B go up an octave. */
const riffNote = (name: string, base: number, prev: string[]) => {
  const climbed = prev.includes('B') && ['C#', 'D'].includes(name) ? 1 : 0;
  const top = name === 'E' && prev.length > 4 ? 1 : 0;
  return `${name}${base + climbed + top}`;
};
const riff = (start: number, bars: readonly (readonly [number, string, number][])[], base: number) =>
  bars.flatMap((b, i) => {
    const seen: string[] = [];
    return b.map(([off, n, len]) => {
      const note = riffNote(n, base, seen);
      seen.push(n);
      return [start + i * 7 + off, note, len] as const;
    });
  });

// ---------- chords ----------
type Chord = 'Em7' | 'A' | 'G' | 'D' | 'E';
const VERSE: Chord[] = ['Em7', 'A', 'Em7', 'A'];
const CHORUS: Chord[] = ['G', 'D', 'A'];
const ROOT = { Em7: 'E', A: 'A', G: 'G', D: 'D', E: 'E' } as const;
const PIANO_VOICING: Record<Chord, string[]> = {
  Em7: ['E4', 'G4', 'B4', 'D5'],
  A: ['E4', 'A4', 'C#5'],
  G: ['D4', 'G4', 'B4'],
  D: ['D4', 'F#4', 'A4'],
  E: ['E4', 'G#4', 'B4', 'E5'],
};
const ORGAN_VOICING: Record<Chord, string[]> = {
  Em7: ['E3', 'B3', 'D4', 'G4'],
  A: ['A3', 'C#4', 'E4', 'A4'],
  G: ['G3', 'B3', 'D4', 'G4'],
  D: ['D3', 'F#3', 'A3', 'D4'],
  E: ['E3', 'G#3', 'B3', 'E4'],
};
const verseBars = VERSE.map((c, i) => [AT.verse + i * 8, c] as const);
const chorusBars = CHORUS.map((c, i) => [AT.chorus + i * 8, c] as const);
const ACCENTS_332 = [0, 3, 6]; // the prog 3-3-2 push inside a 4/4 bar

// ---------- guitar (Rory): power chords ----------
type GuitarNote = readonly [number, string, number, string, number];
export const guitar: { bpm: number; notes: readonly GuitarNote[] } = {
  bpm: BPM,
  notes: [
    ...riff(AT.intro, [RIFF_A, RIFF_B], 2).map(([at, n, len]): GuitarNote => [at, n, len * 0.9, 'open', 0.6]),
    // verse: light palm-muted eighths with 3-3-2 accents — leaves room for the vocal
    ...verseBars.flatMap(([b, c]) =>
      [0, 1, 2, 3, 4, 5, 6, 7].map((e): GuitarNote => {
        const acc = ACCENTS_332.includes(e);
        return [b + e, `${ROOT[c]}2`, 1, acc ? 'open' : 'mute', acc ? 0.5 : 0.32];
      }),
    ),
    ...riff(AT.brk, [RIFF_A, RIFF_B], 2).map(([at, n, len]): GuitarNote => [at, n, len * 0.9, 'open', 0.5]),
    // chorus: big open chords that ring
    ...chorusBars.flatMap(([b, c]): GuitarNote[] => [
      [b, `${ROOT[c]}2`, 3, 'open', 0.65],
      [b + 3, `${ROOT[c]}2`, 3, 'open', 0.55],
      [b + 6, `${ROOT[c]}2`, 2, 'open', 0.55],
    ]),
    [AT.ending, 'E2', 8, 'open', 0.8],
  ],
};

// ---------- bass (Tiki Taka) ----------
type BassNote = readonly [number, string, number, number];
export const bass: { bpm: number; notes: readonly BassNote[] } = {
  bpm: BPM,
  notes: [
    ...riff(AT.intro, [RIFF_A, RIFF_B], 1).map(([at, n, len]): BassNote => [at, n, len * 0.9, 0.75]),
    ...verseBars.flatMap(([b, c]) =>
      ACCENTS_332.map((e): BassNote => [b + e, `${ROOT[c]}1`, e === 6 ? 1.8 : 2.8, 0.7]),
    ),
    ...riff(AT.brk, [RIFF_A, RIFF_B], 1).map(([at, n, len]): BassNote => [at, n, len * 0.9, 0.75]),
    ...chorusBars.flatMap(([b, c]) =>
      [0, 2, 4, 6].map((e): BassNote => [b + e, `${ROOT[c]}${c === 'G' ? 1 : c === 'A' ? 1 : 2}`, 1.8, 0.7]),
    ),
    [AT.ending, 'E1', 8, 0.85],
  ],
};

// ---------- keys (Steggy): a clean, featured piano; the organ joins the riff and adds a soft wash ----------
/** Chord tones for flowing right-hand arpeggios. */
const ARP: Record<Chord, string[]> = {
  Em7: ['E4', 'G4', 'B4', 'D5'],
  A: ['E4', 'A4', 'C#5', 'E5'],
  G: ['D4', 'G4', 'B4', 'D5'],
  D: ['D4', 'F#4', 'A4', 'D5'],
  E: ['E4', 'G#4', 'B4', 'E5'],
};
const RIPPLE = [0, 1, 2, 3, 2, 1]; // up and back down the chord, in 16ths
// the break: a sparkling 16th-note run up and back down E Dorian
const RUN_UP = ['E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'E5', 'D5', 'C#5', 'B4', 'A4'];
const RUN_DOWN = ['B4', 'A4', 'G4', 'F#4', 'E4', 'D4', 'C#4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'D5'];
const FLOURISH = ['E3', 'B3', 'E4', 'G#4', 'B4', 'E5', 'G#5', 'B5']; // ending sweep up the keyboard

export const piano: KeyboardPart = {
  bpm: BPM,
  sound: 'piano',
  gain: 1.9, // featured: sits clearly above the band
  notes: [
    // verse: left-hand roots, right-hand arpeggios rippling in 16ths (accents on the 3-3-2)
    ...verseBars.flatMap(([b, c]) => [
      [b, `${ROOT[c]}3`, 3.8, 0.7, 'L'] as KeyNote,
      [b + 4, `${ROOT[c]}3`, 3.8, 0.62, 'L'] as KeyNote,
      ...Array.from({ length: 16 }, (_, i): KeyNote => {
        const accent = ACCENTS_332.includes(i / 2);
        return [b + i * 0.5, ARP[c][RIPPLE[i % RIPPLE.length]!]!, 0.6, accent ? 0.78 : 0.6, 'R'];
      }),
    ]),
    // break: the run, with the riff in the left hand
    ...[...RUN_UP, ...RUN_DOWN].map((n, i): KeyNote => [AT.brk + i * 0.5, n, 0.55, 0.8, 'R']),
    ...riff(AT.brk, [RIFF_A, RIFF_B], 3).map(([at, n, len]): KeyNote => [at, n, len * 0.9, 0.6, 'L']),
    // chorus: punchy chords on the 3-3-2, octave roots below
    ...chorusBars.flatMap(([b, c]) => [
      ...ACCENTS_332.flatMap(e => PIANO_VOICING[c].map((n): KeyNote => [b + e, n, e === 6 ? 1.8 : 2.6, 0.72, 'R'])),
      [b, `${ROOT[c]}3`, 7.5, 0.7, 'L'] as KeyNote,
    ]),
    // ending: flourish up the keyboard into the final E major chord
    ...FLOURISH.map((n, i): KeyNote => [AT.ending - 2 + i * 0.25, n, 0.5, 0.65, i < 3 ? 'L' : 'R']),
    ...PIANO_VOICING.E.map((n): KeyNote => [AT.ending, n, 8, 0.8, 'R']),
    ...['E3', 'B3'].map((n): KeyNote => [AT.ending, n, 8, 0.75, 'L']),
  ],
};

export const organ: KeyboardPart = {
  bpm: BPM,
  sound: 'organ',
  gain: 0.7,
  notes: [
    // intro: the riff in octaves with guitar and bass
    ...riff(AT.intro, [RIFF_A, RIFF_B], 4).map(([at, n, len]): KeyNote => [at, n, len * 0.95, 0.55, 'R']),
    ...riff(AT.intro, [RIFF_A, RIFF_B], 3).map(([at, n, len]): KeyNote => [at, n, len * 0.95, 0.45, 'L']),
    // a soft wash under the break, chorus and ending (the piano is the star)
    ...['E3', 'B3', 'E4'].map((n): KeyNote => [AT.brk, n, 14, 0.3, 'L']),
    ...chorusBars.flatMap(([b, c]) => ORGAN_VOICING[c].map((n): KeyNote => [b, n, 8, 0.3, 'L'])),
    ...ORGAN_VOICING.E.map((n): KeyNote => [AT.ending, n, 8, 0.35, 'L']),
  ],
};

// ---------- vocals (Paris): bright, open vowels, climbing to a high A ----------
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
    ...phrase(AT.verse, [
      ['B4', 2],
      ['A4', 1, 'e'],
      ['B4', 1],
      ['D5', 2],
      ['E5', 2, 'e'],
    ]),
    ...phrase(AT.verse + 8, [
      ['C#5', 3],
      ['B4', 1, 'e'],
      ['A4', 2],
      ['B4', 2, 'e'],
    ]),
    ...phrase(AT.verse + 16, [
      ['G4', 1],
      ['A4', 1],
      ['B4', 2],
      ['D5', 1],
      ['E5', 1, 'e'],
      ['F#5', 2],
    ]),
    ...phrase(AT.verse + 24, [
      ['E5', 3],
      ['C#5', 1, 'e'],
      ['A4', 4],
    ]),
    ...phrase(AT.chorus, [
      ['D5', 2],
      ['G5', 4],
      ['F#5', 2, 'e'],
    ]),
    ...phrase(AT.chorus + 8, [
      ['F#5', 2],
      ['E5', 2, 'e'],
      ['D5', 2],
      ['A4', 2, 'e'],
    ]),
    ...phrase(AT.chorus + 16, [
      ['C#5', 2],
      ['E5', 2, 'e'],
      ['A5', 4],
    ]),
    [AT.ending, 'E5', 8, 'a', 0.85],
  ],
};

// ---------- drums: Portnoy-style — double bass, ghost notes, tom fills, china accents ----------
/** Length of each bar in 16ths, in song order: count-in · intro (7/8 ×2) · verse ×4 · break (7/8 ×2) · chorus ×3 · ending. */
const BAR_STEPS = [16, 14, 14, 16, 16, 16, 16, 14, 14, 16, 16, 16, 16] as const;
/** Builds a track from {barIndex: pattern}; unspecified bars rest. Throws if a pattern doesn't fit its bar. */
function track(bars: Partial<Record<number, string>>): string {
  return BAR_STEPS.map((len, i) => {
    const p = bars[i] ?? '.'.repeat(len);
    if (p.length !== len) throw new Error(`drum bar ${i} needs ${len} steps, got ${p.length}: ${p}`);
    return p;
  }).join(' ');
}
const B_INTRO = [1, 2];
const B_VERSE = [3, 4, 5, 6];
const B_BREAK = [7, 8];
const B_CHORUS = [9, 10, 11];
const B_END = 12;
const each = (bars: number[], p: string) => Object.fromEntries(bars.map(b => [b, p]));

export const drums: DrumPart = {
  bpm: BPM,
  tracks: {
    click: track({ 0: 'x...x...x...x...' }),
    kick: track({
      ...each(B_INTRO, 'x.......x.x...'),
      ...each(B_VERSE.slice(0, 3), 'x.....x...x.....'),
      6: 'x.....x.........', // fill bar
      ...each(B_BREAK, 'xxxxxxxxxxxxxx'), // double bass under the piano run
      9: 'x.x...x.x.x...x.',
      10: 'x.x...x.x.x...x.',
      11: 'x.x...x.xxxxxxxx', // double-bass push into the ending
      [B_END]: 'X...............',
    }),
    snare: track({
      1: '....X.......X.',
      2: '....X.....xxxx',
      ...each(B_VERSE.slice(0, 3), '....X..g.g..X..g'), // ghost notes
      6: '....X..gxx......', // into the fill
      7: '....X.......X.',
      8: '....X.........',
      ...each(B_CHORUS, '....X.......X...'),
    }),
    tom: track({ 6: '..........xx....', 8: '........xx....' }),
    floorTom: track({ 6: '............xxxx', 8: '..........xxxx' }),
    hat: track({
      ...each(B_INTRO, 'x.x.x.x.x.x.x.'),
      ...each(B_VERSE.slice(0, 3), 'x.x.x.x.x.x.x.x.'),
      6: 'x.x.x.x.........',
    }),
    ride: track({ ...each(B_BREAK, 'x.x.x.x.x.x.x.'), ...each(B_CHORUS, 'x.x.x.x.x.x.x.x.') }),
    splash: track({ 1: '........x.....', 2: '........x.....' }),
    crash: track({ 1: 'X.............', 3: 'x...............', 10: 'X...............' }),
    china: track({ 7: 'X.............', 9: 'X...............', 11: 'X...............', [B_END]: 'X...............' }),
  },
};
