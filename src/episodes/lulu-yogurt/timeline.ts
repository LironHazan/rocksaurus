import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';

// 6 PM, almost the weekend. Lulu wrote specs and plans for the coding agent all week (in her head it's a little
// devil by now) and hardly slept; her protein is low. In the Papo Pako Shapeworks office kitchen only the bad
// yogurts are left: vegan protein, peach, caramel. She asks Mirta, the cleaner, which one is the least yuck; Mirta
// doesn't speak her language, so Lulu holds up two and Mirta points at the peach. It's unbearable; into the bin it
// goes. Bye bye: Omli drives her home, and she drinks a protein shake in bed until she falls asleep. Times are video
// seconds. Under it all, a slow, sad groove on bass and drums.

export const DURATION = 57; // then the end card, see ../outro.ts

/** The groove: 80 BPM, 4/4, so a bar is exactly 3 s. Bars are counted from the start of the Short. */
export const BPM = 80;
export const BAR = (60 / BPM) * 4;
/** Where the arrangement changes, in bars. */
export const BARS = { drumsIn: 3, stop: 12, back: 13, ride: 14, bed: 17, end: 19 } as const;
const bar = (n: number) => n * BAR;

export const CUE = {
  enter: [0, 5], // Lulu drags herself into the kitchen
  specs: [5, 8], // a week of specs for the coding agent: she just stands there, drained
  battery: [8, 11.6], // her protein, nearly empty
  open: 12.0, // the fridge door
  cups: [13.6, 15.6, 17.6], // she looks at each yogurt: vegan, peach, caramel
  sigh: 19.8, // only the bad ones left
  mirta: [bar(7), 32.6], // Mirta mops in; the question
  take: 27.4, // Lulu takes two yogurts out
  point: 30.8, // Mirta points at the peach
  eat: [32.6, bar(BARS.stop)],
  lid: 33.0,
  bites: [34.2, 35.4],
  yuck: [bar(BARS.stop), bar(BARS.back)], // the band stops; so does Lulu
  bye: [bar(BARS.back), bar(BARS.ride)],
  toss: 39.3, // into the bin
  ride: [bar(BARS.ride), bar(BARS.bed)],
  bed: [bar(BARS.bed), DURATION],
  sips: [51.8, 53.0, 54.2],
  asleep: 55.0,
} as const;

/** The three yogurts left in the fridge, left to right on the shelf. */
export const FLAVOURS = ['vegan', 'peach', 'caramel'] as const;
export type Flavour = (typeof FLAVOURS)[number];

export type Who = 'Lulu' | 'Mirta';

/** Lulu asks; Mirta answers in her own language. Then the bye. */
export const LINES: readonly SpokenLine<Who>[] = [
  { from: 23.4, to: 26.0, who: 'Lulu', text: 'Which one is the least… yuck? 🤢' },
  { from: 26.4, to: 28.2, who: 'Mirta', text: 'Ka-neh? Shuma pa-lo? 🤷‍♀️' },
  { from: 28.6, to: 30.6, who: 'Lulu', text: 'This… or this?' },
  { from: 31.0, to: 32.4, who: 'Mirta', text: 'Mm! Mm! 👍' },
  { from: 39.8, to: 41.6, who: 'Lulu', text: 'Bye bye 👋' },
];

/** Lulu's low and tired; Mirta's quick and bright. */
const VOICES: Record<Who, Voice> = {
  Lulu: { notes: ['D3', 'F3', 'G3', 'A3'], rate: 0.2 },
  Mirta: { notes: ['A3', 'C4', 'D4', 'F4'], rate: 0.12 },
};

export const SYLLABLES = syllables(LINES, VOICES, 5);
export const mouthAt = (who: Who, t: number) => mouthOf(SYLLABLES, who, t);
export const speakerAt = (t: number): Who | null => speakerOf(LINES, t);
