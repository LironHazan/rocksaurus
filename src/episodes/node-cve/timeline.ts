import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';

// Another day at Papo Pako Shapeworks. Lulu tries to work; three dinos come by her desk, one after the other, with the
// same entry-level AI question (Rorit, Silvi, Omli). By the third she has made a sign. Then, finally, focus… until
// Yashinozarus, the architect, finds a critical npm vulnerability (upgrade Node.js, no fixes for deprecated versions)
// and DMs her on Hack: come over. She walks over to his desk, and they do the upgrade together. Lucky for them, she
// upgraded every environment to the latest three weeks ago: one patch, green tests, done. Back at her desk, Rorit is
// back with one more question. Times are video seconds. No music: the office.

export const DURATION = 57; // then the end card, see ../outro.ts

/** Who walks up to her desk, in order, and when: walking in, then walking off. */
export const ASKERS = [
  { who: 'Rorit', walk: [3.4, 5.0], leave: [9.4, 10.8] },
  { who: 'Silvi', walk: [10.4, 12.0], leave: [16.4, 17.8] },
  { who: 'Omli', walk: [17.4, 19.2], leave: [23.8, 25.2] },
  { who: 'Rorit', walk: [51.0, 52.2], leave: [DURATION + 1, DURATION + 2] }, // back, one more time
] as const;

export const CUE = {
  /** She tapes the sign to her monitor between the second and third. */
  sign: 17.0,
  /** Her focus mode. */
  focus: [25.0, 30.0],
  /** Meanwhile, Yashinozarus at his desk: the audit, then his DM to her. */
  yashi: [30.0, 36.0],
  dm: 34.4,
  /** His DM lands on her screen. */
  ping: 36.0,
  /** She walks over to his desk… */
  walkOver: [39.4, 42.2],
  /** …and they patch it together, on his screen: he upgrades the images with the patched Node.js. */
  patch: [45.2, 49.0],
  /** Back at her desk. */
  back: 50.6,
  /** The last question: her head goes down onto the desk. */
  facePlant: 55.4,
} as const;

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 5.2, to: 7.4, who: 'Rorit', text: 'Quick one between sets: what’s an AI agent? 🏋️' },
  { from: 7.6, to: 9.2, who: 'Lulu', text: 'A loop. With tools 🔁' },
  { from: 12.2, to: 14.4, who: 'Silvi', text: 'Hey hun! What IS an agent, really? ✨' },
  { from: 14.6, to: 16.2, who: 'Lulu', text: '…A loop. With tools.' },
  { from: 19.4, to: 21.4, who: 'Omli', text: 'Bro. What’s an AI agent? 💪' },
  { from: 21.6, to: 23.6, who: 'Lulu', text: 'IT’S. A. LOOP. WITH. TOOLS. 😤' },
  { from: 32.8, to: 34.2, who: 'Yashinozarus', text: 'Hm. Critical. Again 🧐' },
  { from: 42.6, to: 45.0, who: 'Lulu', text: 'Relax. Everything’s been on latest for 3 weeks 😎' },
  { from: 45.2, to: 47.8, who: 'Yashinozarus', text: 'I’m upgrading the images with the patch 🐳' },
  { from: 49.2, to: 50.5, who: 'Yashinozarus', text: 'Impressive 🧐' },
  { from: 52.4, to: 55.0, who: 'Rorit', text: 'Sorry, one more: what’s an AGENT? 🤖' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 26);

/** Where we are: Lulu's desk, or his. */
export type Where = 'lulu' | 'yashi';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'lulu'],
  [CUE.yashi[0], 'yashi'],
  [CUE.yashi[1], 'lulu'],
  [CUE.walkOver[0], 'yashi'],
  [CUE.back, 'lulu'],
];
