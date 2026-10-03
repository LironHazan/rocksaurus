import type { DrumPart } from '../../audio/drum-patterns';
import type { GuitarPart } from '../../band/guitarist';

// Hard rock in E, 4/4 @ 120 BPM: 1 eighth = 0.25 s, 1 bar = 2 s, 7 bars = 14 s.
//   bar 0     a ringing open chord and four stick clicks
//   bars 1–5  the riff, with drums and bass
//   bar 6     big last chord, Rory poses
export const BPM = 120;
export const BEAT = 60 / BPM;
export const RIFF_IN = 2; // seconds
export const POSE = 12;
export const DURATION = 14;

type Hit = readonly [number, string, number, ('mute' | 'open')?, number?];
const chug = (at: number, vel = 1): Hit[] => [
  [at, 'E2', 1, 'mute', vel],
  [at + 1, 'E2', 1, 'mute', vel],
];
/** The hook: chug, a chord, chug, a chord… and a sneaky B♭ (the devil's interval) at the end. */
const barA = (b: number): Hit[] => [
  ...chug(b),
  [b + 2, 'G2', 1, 'open'],
  ...chug(b + 3),
  [b + 5, 'A2', 1, 'open'],
  [b + 6, 'E2', 1, 'mute'],
  [b + 7, 'Bb2', 1, 'open'],
];
/** The answer: up to D and walking back down. */
const barB = (b: number): Hit[] => [
  ...chug(b),
  [b + 2, 'D3', 2, 'open'],
  [b + 4, 'C3', 1, 'open'],
  [b + 5, 'B2', 1, 'open'],
  [b + 6, 'A2', 1, 'open'],
  [b + 7, 'G2', 1, 'open'],
];

export const guitar: GuitarPart = {
  bpm: BPM,
  notes: [
    [0, 'E2', 8, 'open', 0.8],
    ...barA(8),
    ...barB(16),
    ...barA(24),
    ...barB(32),
    ...barA(40),
    [48, 'E2', 8, 'open'],
  ],
};

/** The bass doubles the riff's roots an octave down. */
export const bass = {
  bpm: BPM,
  notes: guitar.notes
    .filter(([at]) => at >= 8 && at < 48)
    .map(([at, note, len]) => [at, note.replace(/\d$/, d => String(Number(d) - 1)), len, 0.8] as const),
};

const REST = '................';
export const drums: DrumPart = {
  bpm: BPM,
  tracks: {
    click: ['x...x...x...x...'].join(''),
    kick: [REST, ...Array(4).fill('x.x.....x.x.....'), 'x.x.....x.x.x.x.', 'X...............'].join(' '),
    snare: [REST, ...Array(4).fill('....x.......x...'), '....x.......xxxx', REST].join(' '),
    hat: [REST, ...Array(5).fill('x.x.x.x.x.x.x.x.'), REST].join(' '),
    crash: [REST, 'x...............', REST, REST, REST, REST, 'X...............'].join(' '),
  },
};
