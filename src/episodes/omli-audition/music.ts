import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../band/bassist';
import type { GuitarPart } from '../../band/guitarist';
import type { Activity } from '../../band/types';
import { BAR, BARS, BPM } from './timeline';

// The audition: an original heavy groove riff in E, 100 BPM. Omli plays it alone for three bars, Lulu comes in on
// drums, then Rory lays big ringing power chords under it; one last hit, and a pose. Times here are SONG seconds (0 = the first note);
// the episode plays everything from `MUSIC_AT`.

type Note = readonly [eighth: number, note: string, len: number];
/** The groove: chugs, a slide up to G, the syncopated A–B♭–A, back down to the low E. */
const GROOVE: readonly Note[] = [
  [0, 'E1', 0.5],
  [0.5, 'E1', 0.5],
  [1.5, 'E1', 0.5],
  [2, 'G1', 1],
  [3, 'E1', 0.5],
  [3.5, 'E1', 0.5],
  [4, 'A1', 0.75],
  [5, 'A#1', 0.5],
  [5.5, 'A1', 0.5],
  [6, 'G1', 0.5],
  [6.5, 'E1', 1.5],
];
/** Every third bar turns around: a chromatic run down from D. */
const TURN: readonly Note[] = [
  ...GROOVE.slice(0, 6),
  ...(['D2', 'C#2', 'C2', 'B1', 'A#1', 'A1', 'G1', 'F#1'] as const).map((n, i): Note => [4 + i * 0.5, n, 0.5]),
];
const barOf = (b: number) => (b % 3 === 2 ? TURN : GROOVE);

const EIGHTHS = 8;
const LAST = BARS.lastHit * EIGHTHS;

export const BASS: BassPart = {
  bpm: BPM,
  notes: [
    ...Array.from({ length: BARS.lastHit }, (_, b) =>
      barOf(b).map(([at, n, len]) => [b * EIGHTHS + at, n, len * 0.95, 0.85] as const),
    ).flat(),
    [LAST, 'E1', 8, 0.95],
  ],
};

/**
 * Rory doesn't copy the bass: one big power chord per chord, left to ring, under Omli's riff. Heavier that way.
 * Groove bars: E (half a bar) · A · G. Turnaround bars: E · D · A, under the chromatic run.
 */
const CHORDS: Record<'groove' | 'turn', readonly Note[]> = {
  groove: [
    [0, 'E2', 4],
    [4, 'A2', 2],
    [6, 'G2', 2],
  ],
  turn: [
    [0, 'E2', 4],
    [4, 'D2', 2],
    [6, 'A2', 2],
  ],
};
export const GUITAR: GuitarPart = {
  bpm: BPM,
  notes: [
    ...Array.from({ length: BARS.lastHit - BARS.guitarIn }, (_, i) => {
      const b = BARS.guitarIn + i;
      return CHORDS[b % 3 === 2 ? 'turn' : 'groove'].map(
        ([at, root, len]) => [b * EIGHTHS + at, root, len * 0.97, 'open', 0.62] as const,
      );
    }).flat(),
    [LAST, 'E2', 8, 'open', 0.7],
  ],
};

/** Drum bars, one string per bar (16 steps); bars before Lulu comes in rest. */
function drumTrack(play: (b: number) => string): string {
  return Array.from({ length: BARS.lastHit + 1 }, (_, b) => (b < BARS.drumsIn ? '.'.repeat(16) : play(b))).join(' ');
}
const FILL_BAR = BARS.lastHit - 1;
export const DRUMS: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: drumTrack(b => (b === BARS.lastHit ? 'x...............' : 'x.x..x..x.x..x..')),
    snare: drumTrack(b =>
      b === BARS.lastHit ? '................' : b === FILL_BAR ? '....x.......xxxx' : '....x.......x...',
    ),
    hat: drumTrack(b =>
      b >= FILL_BAR ? (b === FILL_BAR ? 'x.x.x.x.x.x.....' : '................') : 'x.x.x.x.x.x.x.x.',
    ),
    tom: drumTrack(b => (b === FILL_BAR ? '..............xx' : '................')),
    crash: drumTrack(b =>
      b === BARS.drumsIn || b === BARS.guitarIn || b === BARS.lastHit ? 'x...............' : '................',
    ),
  },
};

/** When each player is playing (song seconds). */
const playing =
  (from: number) =>
  (t: number): Activity =>
    t >= BARS.lastHit * BAR + 0.4 ? 'pose' : t >= from ? 'play' : 'idle';
export const omliPlays = playing(0);
export const luluPlays = playing(BARS.drumsIn * BAR);
export const roryPlays = playing(BARS.guitarIn * BAR);
