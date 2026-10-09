import type { DrumPart } from '../../audio/drum-patterns';
import type { BassPart } from '../../audio/bass';
import { BARS, BPM } from './timeline';

// A slow, sad groove in D minor, 80 BPM: Dm · B♭ · Gm · A, one chord a bar, round and over again. The bass walks in
// alone while Lulu drags herself to the fridge; the drums join, laid back, with ghost notes on the snare. When the
// peach hits, the whole band stops dead for a bar. It comes back for the bye and the ride home (on the ride
// cymbal), and in bed the drums leave: the bass slows to whole notes and lets the last D ring as she falls asleep.
// Times are SONG seconds; the song starts with the Short.

type Note = readonly [eighth: number, note: string, len: number];

/** One chord's notes: its root, the fifth, the octave, and the note that leads into the next chord. */
interface Chord {
  root: string;
  fifth: string;
  octave: string;
  lead: string;
}
const CHORDS: readonly Chord[] = [
  { root: 'D2', fifth: 'A2', octave: 'D3', lead: 'C2' }, // Dm
  { root: 'A#1', fifth: 'F2', octave: 'A#2', lead: 'A1' }, // B♭
  { root: 'G1', fifth: 'D2', octave: 'G2', lead: 'G#1' }, // Gm
  { root: 'A1', fifth: 'E2', octave: 'A2', lead: 'C#2' }, // A, back up to D
];
const chordOf = (b: number) => CHORDS[b % CHORDS.length]!;

/** The groove bar: a long root, the fifth, a pick-up octave, the root again, and the lead-in to the next chord. */
function grooveBar({ root, fifth, octave, lead }: Chord): readonly Note[] {
  return [
    [0, root, 1.5],
    [1.5, root, 0.5],
    [2, fifth, 1],
    [3.5, octave, 0.5],
    [4, root, 1.5],
    [6, fifth, 0.5],
    [6.5, octave, 0.5],
    [7.5, lead, 0.5],
  ];
}
/** In bed: one root a bar, left to ring. */
const sleepyBar = ({ root }: Chord): readonly Note[] => [[0, root, 7.5]];
/** The stop: one note on the one, then nothing. */
const stopBar = ({ root }: Chord): readonly Note[] => [[0, root, 0.5]];

function bassBar(b: number): readonly Note[] {
  if (b === BARS.stop) return stopBar(chordOf(b));
  if (b >= BARS.bed) return sleepyBar(chordOf(b));
  return grooveBar(chordOf(b));
}

const EIGHTHS = 8;
/** Velocity: soft, a little softer in bed. */
const velocity = (b: number) => (b >= BARS.bed ? 0.6 : 0.8);

export const BASS: BassPart = {
  bpm: BPM,
  notes: [
    ...Array.from({ length: BARS.end - 1 }, (_, b) =>
      bassBar(b).map(([at, n, len]) => [b * EIGHTHS + at, n, len * 0.95, velocity(b)] as const),
    ).flat(),
    [(BARS.end - 1) * EIGHTHS, 'D2', 8, 0.55], // the last D, ringing out as she's asleep
  ],
};

const REST = '.'.repeat(16);
/** Drum bars, one string per bar (16 steps). Before the drums come in, in the stop, and in bed: rests. */
function drumTrack(groove: (b: number) => string, stop = REST): string {
  return Array.from({ length: BARS.end }, (_, b) => {
    if (b < BARS.drumsIn || b >= BARS.bed) return REST;
    return b === BARS.stop ? stop : groove(b);
  }).join(' ');
}
/** The ride home is on the ride cymbal; the kitchen is on the hi-hat. */
const onTheRide = (b: number) => b >= BARS.ride;
/** The bar before a change gets a little fill. */
const FILLS: readonly number[] = [BARS.stop - 1, BARS.ride - 1, BARS.bed - 1];

export const DRUMS: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: drumTrack(() => 'x......x..x.....', 'X...............'),
    snare: drumTrack(b => (FILLS.includes(b) ? '..g.....x...xgxx' : '......g.x.....g.')),
    hat: drumTrack(b => (onTheRide(b) ? REST : 'x.x.x.x.x.x.x.o.')),
    ride: drumTrack(b => (onTheRide(b) ? 'x..xx..xx..xx..x' : REST)),
    crash: drumTrack(
      b => (b === BARS.drumsIn || b === BARS.back || b === BARS.ride ? 'x...............' : REST),
      'X...............',
    ),
  },
};
