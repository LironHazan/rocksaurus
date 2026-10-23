import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';

// Another day at Papo Pako Shapeworks. Lulu tries to work; three dinos come by her desk, one after the other, with the
// same entry-level AI question (Rorit, Silvi, Omli). By the third she has made a sign. Then, finally, focus… until Yashinozarus, the
// architect, finds a critical npm vulnerability: upgrade Node.js, no fixes for deprecated versions. Lucky for her,
// Lulu upgraded every environment to the latest three weeks ago: one patch, green tests, done. Then Rorit is
// back with one more question. Times are video seconds. No music: the office.

export const DURATION = 56; // then the end card, see ../outro.ts

/** Who walks up to her desk, in order, and when: walking in, then walking off. */
export const ASKERS = [
  { who: 'Rorit', walk: [3.4, 5.0], leave: [9.4, 10.8] },
  { who: 'Silvi', walk: [10.4, 12.0], leave: [16.4, 17.8] },
  { who: 'Omli', walk: [17.4, 19.2], leave: [23.8, 25.2] },
  { who: 'Rorit', walk: [50.0, 51.4], leave: [DURATION + 1, DURATION + 2] }, // back, one more time
] as const;

export const CUE = {
  /** She tapes the sign to her monitor between the second and third. */
  sign: 17.0,
  /** Her focus mode. */
  focus: [25.0, 30.0],
  /** Meanwhile, Yashinozarus at his desk. */
  yashi: [30.0, 36.0],
  /** His message lands on her screen. */
  ping: 36.0,
  /** She checks: already on the latest. One patch, tests, done. */
  patch: [40.6, 46.4],
  /** Back at his desk, her reply. */
  reply: [46.4, 50.0],
  /** The last question: her head goes down onto the desk. */
  facePlant: 54.4,
} as const;

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 5.2, to: 7.4, who: 'Rorit', text: 'Quick one between sets: what’s an AI agent? 🏋️' },
  { from: 7.6, to: 9.2, who: 'Lulu', text: 'A loop. With tools 🔁' },
  { from: 12.2, to: 14.4, who: 'Silvi', text: 'Hey hun! What IS an agent, really? ✨' },
  { from: 14.6, to: 16.2, who: 'Lulu', text: '…A loop. With tools.' },
  { from: 19.4, to: 21.4, who: 'Omli', text: 'Bro. What’s an AI agent? 💪' },
  { from: 21.6, to: 23.6, who: 'Lulu', text: 'IT’S. A. LOOP. WITH. TOOLS. 😤' },
  { from: 33.4, to: 35.4, who: 'Yashinozarus', text: 'Hm. Critical. Again 🧐' },
  { from: 47.6, to: 49.4, who: 'Yashinozarus', text: 'Impressive 🧐' },
  { from: 51.6, to: 54.2, who: 'Rorit', text: 'Sorry, one more: what’s an AGENT? 🤖' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 26);

/** Where we are: Lulu's desk, or his. */
export type Where = 'lulu' | 'yashi';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'lulu'],
  [CUE.yashi[0], 'yashi'],
  [CUE.yashi[1], 'lulu'],
  [CUE.reply[0], 'yashi'],
  [CUE.reply[1], 'lulu'],
];
