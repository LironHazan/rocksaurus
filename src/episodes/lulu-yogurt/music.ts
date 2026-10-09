import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import type { GuitarPart } from '../../band/guitarist';
import { BARS, BPM } from './timeline';

// Lulu's scenes are Lulu's instrument: drums alone, 80 BPM, in a slow, sad half time: one soft kick a bar, a quiet
// snare on beat 3 with ghost notes round it, the hi-hat barely touched on the quarters, soft tom rolls for fills.
// When the peach hits, the drums stop dead for a bar; they come back for the bye. In Omli's car the bass player is
// driving, so the bass comes in, and it turns into a heavy metal groove: palm-muted chugs on a low D, a tritone, a
// chromatic fall, double kicks, a distorted guitar on the riff. In bed it's drums alone again, barely there,
// thinning out to one soft hit as she falls asleep. Times are SONG seconds; the song starts with the Short.

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
const onTheRide = (b: number) => b >= BARS.ride && b < BARS.bed;
const inBed = (b: number) => b >= BARS.bed;
/** The very last bar: she's asleep. */
const LAST = BARS.end - 1;

/** A part that plays the same bar every time. */
const every = (bar: string) => () => bar;
const silent = every(REST);

/** One drum's whole part, a string per bar (16 steps): the kitchen groove, the stop, the car, the bed. */
function drumTrack({
  groove,
  stop = REST,
  metal = silent,
  bed = silent,
}: {
  groove: (b: number) => string;
  stop?: string;
  metal?: (b: number) => string;
  bed?: (b: number) => string;
}): string {
  return Array.from({ length: BARS.end }, (_, b) => {
    if (b === BARS.stop) return stop;
    if (onTheRide(b)) return metal(b);
    if (inBed(b)) return bed(b);
    return groove(b);
  }).join(' ');
}
/** The bar before a change gets a little fill. */
const FILLS: readonly number[] = [BARS.stop - 1, BARS.ride - 1];

export const DRUMS: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: drumTrack({
      groove: every('x.....g.........'), // half time: one soft kick a bar, and a ghost after it
      stop: 'X...............',
      metal: every('xxxxx.xxxxxxx.xx'), // double kicks under the chugs
      bed: b => (b === LAST ? 'g...............' : 'g.......g.......'), // a heartbeat, slowing
    }),
    snare: drumTrack({
      groove: b => (FILLS.includes(b) ? '....g...x.......' : '....g...x.....g.'), // beat 3, quiet, ghosts round it
      metal: b => (b === BARS.bed - 1 ? '....X.....XxXXXX' : '....X.......X...'), // a big roll into the bed
    }),
    hat: drumTrack({
      groove: every('g...g...g...g...'), // only the quarters, barely touched
      metal: every('X.x.X.x.X.x.X.x.'),
      bed: b => (b === LAST ? 'g...g...........' : 'g...g...g...g...'),
    }),
    crash: drumTrack({
      groove: b => (b === BARS.back ? 'x...............' : REST), // back after the stop, softly
      stop: 'X...............',
      metal: b => (b === BARS.ride ? 'X...............' : REST),
    }),
    china: drumTrack({ groove: silent, metal: every('......X.......X.') }),
    // a soft roll down the toms instead of a snare fill, into the stop and into the car
    tom: drumTrack({ groove: b => (FILLS.includes(b) ? '..........g.g.g.' : REST) }),
    floorTom: drumTrack({ groove: b => (FILLS.includes(b) ? '...............g' : REST) }),
  },
};
