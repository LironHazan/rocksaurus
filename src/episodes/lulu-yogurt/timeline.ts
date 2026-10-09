import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';

// 6 PM, almost the weekend. Lulu wrote specs and plans for the coding agent all week (in her head it's a little
// devil by now) and hardly slept; her protein is low. In the Papo Pako Shapeworks office kitchen only the bad
// yogurts are left: vegan protein, peach, caramel. She asks Mirta, the cleaner, which one is the least yuck; Mirta
// doesn't get it, so Lulu holds up two and Mirta points at the peach. It's unbearable; into the bin it
// goes. Bye bye: Omli drives her home, and she drinks a protein shake in bed until she falls asleep. Times are video
// seconds. Under it all, Lulu's drums; Omli's bass (and a guitar) join only in his car.

export const DURATION = 60; // then the end card, see ../outro.ts

/** The groove: 80 BPM, 4/4, so a bar is exactly 3 s. Bars are counted from the start of the Short. */
export const BPM = 80;
export const BAR = (60 / BPM) * 4;
/** Where the arrangement changes, in bars. */
export const BARS = { stop: 14, back: 15, ride: 16, bed: 18, end: 20 } as const;
const bar = (n: number) => n * BAR;

export const CUE = {
  enter: [0, 5], // Lulu drags herself into the kitchen
  specs: [5, 14], // a week of specs for the coding agent: the pile grows, then the agent laughs. Long enough to read.
  battery: [14, 17.6], // her protein, nearly empty
  open: 18.0, // the fridge door
  cups: [19.6, 21.6, 23.6], // she looks at each yogurt: vegan, peach, caramel
  sigh: 25.8, // only the bad ones left
  mirta: [bar(9), 38.6], // Mirta mops in; the question
  take: 33.4, // Lulu takes two yogurts out
  point: 36.8, // Mirta points at the peach
  eat: [38.6, bar(BARS.stop)],
  lid: 39.0,
  bites: [40.2, 41.4],
  yuck: [bar(BARS.stop), bar(BARS.back)], // the band stops; so does Lulu
  bye: [bar(BARS.back), bar(BARS.ride)],
  toss: 45.3, // into the bin
  ride: [bar(BARS.ride), bar(BARS.bed)],
  bed: [bar(BARS.bed), DURATION],
  sips: [54.8, 56.0, 57.2],
  asleep: 58.0,
} as const;

/** When the pile has stopped growing and the agent starts laughing: the rest of the beat is for the joke. */
export const SPECS_TURN = CUE.specs[0] + 3.5;

/** The three yogurts left in the fridge, left to right on the shelf. */
export const FLAVOURS = ['vegan', 'peach', 'caramel'] as const;
export type Flavour = (typeof FLAVOURS)[number];

export type Who = 'Lulu' | 'Mirta';

/** Lulu asks; Mirta answers with a puzzled rawr. Then the bye. */
export const LINES: readonly SpokenLine<Who>[] = [
  { from: 29.4, to: 32.0, who: 'Lulu', text: 'Which one is the least… yuck? 🤢' },
  { from: 32.4, to: 34.2, who: 'Mirta', text: 'Rawr? Grrk? 🤷‍♀️' },
  { from: 34.6, to: 36.6, who: 'Lulu', text: 'This… or this?' },
  { from: 37.0, to: 38.4, who: 'Mirta', text: 'Mm! Mm! 👍' },
  { from: 45.8, to: 47.6, who: 'Lulu', text: 'Bye bye 👋' },
];

/** Lulu's low and tired; Mirta's quick and bright. */
const VOICES: Record<Who, Voice> = {
  Lulu: { notes: ['D3', 'F3', 'G3', 'A3'], rate: 0.2 },
  Mirta: { notes: ['A3', 'C4', 'D4', 'F4'], rate: 0.12 },
};

export const SYLLABLES = syllables(LINES, VOICES, 5);
export const mouthAt = (who: Who, t: number) => mouthOf(SYLLABLES, who, t);
export const speakerAt = (t: number): Who | null => speakerOf(LINES, t);
