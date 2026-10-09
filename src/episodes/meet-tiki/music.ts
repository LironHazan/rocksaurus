// 4/4 @ 120 BPM: 1 eighth = 0.25 s, 1 bar = 2 s, 6 bars = 12 s.
export const BPM = 120;
export const BEAT = 60 / BPM;

import type { BassPart } from '../../audio/bass';
import type { DrumPart } from '../../audio/drum-patterns';

type Notes = BassPart['notes'];

// [eighth, note, lengthInEighths, velocity]
const grooveA = (b: number): Notes => [
  [b, 'E1', 1.5],
  [b + 1.5, 'E1', 0.5, 0.7],
  [b + 2, 'E2', 1],
  [b + 3, 'E1', 1],
  [b + 4, 'G1', 1],
  [b + 5, 'A1', 1],
  [b + 6, 'B1', 1],
  [b + 7, 'D2', 1, 0.8],
];
const grooveB = (b: number): Notes => [
  [b, 'A1', 1.5],
  [b + 1.5, 'A1', 0.5, 0.7],
  [b + 2, 'A2', 1],
  [b + 3, 'A1', 1],
  [b + 4, 'G1', 1],
  [b + 5, 'G1', 1],
  [b + 6, 'F#1', 1],
  [b + 7, 'E1', 1, 0.8],
];

export const bass: BassPart = {
  bpm: BPM,
  notes: [
    [0, 'E1', 3],
    [3, 'E1', 1, 0.8],
    [4, 'G1', 2],
    [6, 'A1', 2], // bar 0: laid-back intro, bass alone
    ...grooveA(8),
    ...grooveB(16),
    ...grooveA(24),
    ...grooveB(32), // bars 1–4: the groove
    [40, 'E1', 2],
    [42, 'E2', 2],
    [44, 'E1', 4], // bar 5: ending
  ],
};

const REST = '................';
// light backing beat so the groove sits (drummer off-screen)
export const drums: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: [
      REST,
      'x.......x.......',
      'x.......x.x.....',
      'x.......x.......',
      'x.......x.x.....',
      'x...............',
    ].join(' '),
    snare: [REST, '....x.......x...', '....x.......x...', '....x.......x...', '....x.......x...', REST].join(' '),
    hat: [REST, 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.o...', REST].join(' '),
    crash: [REST, REST, REST, REST, REST, 'x...............'].join(' '),
  },
};

export const GLASSES_DOWN = 10.3; // he slides his sunglasses down…
export const WINK = 11.0; // …and winks
