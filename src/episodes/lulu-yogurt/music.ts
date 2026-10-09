import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import type { GuitarPart } from '../../band/guitarist';
import { BARS, BPM } from './timeline';

// No music in Lulu's scenes: the kitchen and the bed are natural sound only. The music is Omli's car stereo: a heavy
// metal groove at 80 BPM (palm-muted chugs on a low D, a tritone, a chromatic fall; double kicks; a distorted guitar
// on the riff, the bass under it). Times are SONG seconds from the start of the Short; the band plays only on the
// ride's bars.

type Note = readonly [eighth: number, note: string, len: number];

/** Omli's car: the metal riff, one bar, in guitar notes. Short ones are palm-muted chugs. */
const METAL: readonly Note[] = [
  [0, 'D2', 0.5],
  [0.5, 'D2', 0.25],
  [1, 'D2', 0.25],
  [1.5, 'F2', 0.5],
  [2, 'D2', 0.25],
  [2.5, 'D2', 0.25],
  [3, 'G#2', 0.5], // the tritone
  [3.5, 'A2', 0.5],
  [4, 'D2', 0.25],
  [4.5, 'D2', 0.25],
  [5, 'D2', 0.25],
  [5.5, 'D2', 0.25],
  [6, 'C3', 0.5], // and a chromatic fall back to the chugs
  [6.5, 'A#2', 0.5],
  [7, 'A2', 0.5],
  [7.5, 'G#2', 0.5],
];
/** A note an octave lower: the bass doubles the guitar's riff underneath it. */
const octaveDown = (note: string) => note.replace(/\d$/, d => String(Number(d) - 1));
const PALM_MUTE = 0.25;
const EIGHTHS = 8;
const RIDE_BARS = Array.from({ length: BARS.bed - BARS.ride }, (_, i) => BARS.ride + i);

/** The bass: only in Omli's car, under the guitar, digging in. */
export const BASS: BassPart = {
  bpm: BPM,
  notes: RIDE_BARS.flatMap(b =>
    METAL.map(([at, n, len]) => [b * EIGHTHS + at, octaveDown(n), len * 0.95, 0.95] as const),
  ),
};

/** The guitar: only in Omli's car, on the riff; chugs palm-muted, the rest left to ring a little. */
export const GUITAR: GuitarPart = {
  bpm: BPM,
  notes: RIDE_BARS.flatMap(b =>
    METAL.map(
      ([at, root, len]) => [b * EIGHTHS + at, root, len * 0.9, len <= PALM_MUTE ? 'mute' : 'open', 0.8] as const,
    ),
  ),
};

const REST = '.'.repeat(16);

/** One drum's part: rests everywhere but the car, where it plays `metal(bar)`. */
function drumTrack(metal: (b: number) => string): string {
  return Array.from({ length: BARS.end }, (_, b) => (RIDE_BARS.includes(b) ? metal(b) : REST)).join(' ');
}
/** A part that plays the same bar every time. */
const every = (bar: string) => () => bar;

export const DRUMS: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: drumTrack(every('xxxxx.xxxxxxx.xx')), // double kicks under the chugs
    snare: drumTrack(b => (b === BARS.bed - 1 ? '....X.....XxXXXX' : '....X.......X...')), // a big roll into the bed
    hat: drumTrack(every('X.x.X.x.X.x.X.x.')),
    crash: drumTrack(b => (b === BARS.ride ? 'X...............' : REST)),
    china: drumTrack(every('......X.......X.')),
  },
};
