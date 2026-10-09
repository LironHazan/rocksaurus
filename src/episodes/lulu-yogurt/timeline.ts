import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';

// 6 PM, almost the weekend. Lulu wrote specs and plans for the coding agent all week (in her head it's a little
// devil by now) and hardly slept; her protein is low. In the Papo Pako Shapeworks office kitchen only the bad
// yogurts are left: vegan protein, peach, caramel. She asks Mirta, the cleaner, which one is the least yuck; Mirta
// doesn't get it, so Lulu holds up two and Mirta points at the peach. It's unbearable; into the bin it
// goes. Bye bye: Omli drives her home, and she drinks a protein shake in bed until she falls asleep. Times are video
// seconds. No music, except on Omli's car stereo: heavy metal.

export const DURATION = 58.5; // then the end card, see ../outro.ts

/** The car stereo's tempo: 80 BPM, 4/4, so a bar is exactly 3 s. Its song starts when the ride does. */
export const BPM = 80;
export const BAR = (60 / BPM) * 4;

export const CUE = {
  enter: [0, 5], // Lulu drags herself into the kitchen
  specs: [5, 12.5], // a week of specs for the coding agent: the pile grows, then the agent laughs and the joke holds
  battery: [12.5, 16.1], // her protein, nearly empty
  open: 16.5, // the fridge door
  cups: [18.1, 20.1, 22.1], // she looks at each yogurt: vegan, peach, caramel
  sigh: 24.3, // only the bad ones left
  mirta: [25.5, 37.1], // Mirta mops in; the question
  take: 31.9, // Lulu takes two yogurts out
  point: 35.3, // Mirta points at the peach
  eat: [37.1, 40.5],
  lid: 37.5,
  bites: [38.7, 39.9],
  yuck: [40.5, 43.5], // Lulu freezes
  bye: [43.5, 46.5],
  toss: 43.8, // into the bin
  ride: [46.5, 52.5], // two bars of the car stereo
  bed: [52.5, DURATION],
  sips: [53.3, 54.5, 55.7],
  asleep: 56.5,
} as const;

/** When the pile has stopped growing and the agent starts laughing: the rest of the beat is for the joke. */
export const SPECS_TURN = CUE.specs[0] + 3.5;

/** Every version she wrote this week, oldest first: they pile up in her thought bubble. */
export const SPEC_PAGES = ['SPEC v1', 'SPEC v3', 'PLAN v5', 'SPEC v9', 'PLAN v12'] as const;
/** When each page lands on the pile: the first with the bubble, the last just before the agent turns. */
const PILE = { from: CUE.specs[0] + 0.4, to: SPECS_TURN - 0.2 } as const;
export const PAGE_AT = SPEC_PAGES.map((_, i) => PILE.from + (i / (SPEC_PAGES.length - 1)) * (PILE.to - PILE.from));

/** The yogurt she's judging hops on the shelf: |sin(rate · t)|, so it lands every π / rate seconds (radians/s). */
export const CUP_HOP_RATE = 6;
/** Every time a judged yogurt lands back on the shelf, from the first look to the sigh: a little bloop each. */
export const CUP_LANDINGS = [...CUE.cups, CUE.sigh].slice(0, -1).flatMap((from, i) => {
  const to = [...CUE.cups, CUE.sigh][i + 1]!;
  const hop = Math.PI / CUP_HOP_RATE;
  return Array.from({ length: Math.ceil((to - from) / hop) }, (_, k) => (Math.ceil(from / hop) + k) * hop).filter(
    at => at < to,
  );
});

/** The three yogurts left in the fridge, left to right on the shelf. */
export const FLAVOURS = ['vegan', 'peach', 'caramel'] as const;
export type Flavour = (typeof FLAVOURS)[number];

export type Who = 'Lulu' | 'Mirta';

/** Lulu asks; Mirta answers with a puzzled rawr. Then the bye. */
export const LINES: readonly SpokenLine<Who>[] = [
  { from: 27.9, to: 30.5, who: 'Lulu', text: 'Which one is the least… yuck? 🤢' },
  { from: 30.9, to: 32.7, who: 'Mirta', text: 'Rawr? Grrk? 🤷‍♀️' },
  { from: 33.1, to: 35.1, who: 'Lulu', text: 'This… or this?' },
  { from: 35.5, to: 36.9, who: 'Mirta', text: 'Mm! Mm! 👍' },
  { from: 44.3, to: 46.1, who: 'Lulu', text: 'Bye bye 👋' },
];

/** Lulu's low and tired; Mirta's quick and bright. */
const VOICES: Record<Who, Voice> = {
  Lulu: { notes: ['D3', 'F3', 'G3', 'A3'], rate: 0.2 },
  Mirta: { notes: ['A3', 'C4', 'D4', 'F4'], rate: 0.12 },
};

export const SYLLABLES = syllables(LINES, VOICES, 5);
export const mouthAt = (who: Who, t: number) => mouthOf(SYLLABLES, who, t);
export const speakerAt = (t: number): Who | null => speakerOf(LINES, t);
