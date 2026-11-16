import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';
import type { TimedChatLine } from '../../props/phone';
import type { ScriptLine } from '../../world/screen-script';

// The DevOps floor at Papo Pako Shapeworks, 9 AM. An email from Chuks lands on Rorit's screen: Narnia compliance, a
// new, Narnia-approved domain name for everything. She alerts the DevOps group chat: Amazaurus does the maths (200
// microservices, 200 certs to reissue), Eilon remembers the domain is hardcoded everywhere, and Eter takes the lead.
// Yashinozarus gets the name approved by upper management in 24 hours: the easy part. Then the real DevOps pain:
// 200 certs, one by one, and 4,812 hardcoded domains to replace, and all four of them in it, stressed, for months.
// Then Lulu walks by: "We'll be compliant to Narnia in year 20666. No worries." Times are video seconds. No music.

export const DURATION = 56; // then the end card, see ../outro.ts

export const CUE = {
  /** The email lands on Rorit's monitor, and she opens it. */
  mail: 3.6,
  open: 4.6,
  /** Her face, and the phone comes out: from here on, they're all stressed. */
  gasp: 8.6,
  phoneOut: 9.6,
  /** The group chat, on everyone's phones. */
  chat: [10.0, 20.6],
  /** Yashinozarus: the name, approved in 24 hours. */
  yashi: [20.6, 28.6],
  /** Eter at her desk: the plan, and what's left on it. */
  board: [28.6, 33.0],
  /** The grind: 200 certs and 4,812 hardcoded domains, all four of them typing, for months. */
  grind: [33.0, 45.0],
  /** Lulu walks over to Eter's desk. */
  lulu: [45.0, 47.6],
  /** The calendar lands on the year Lulu names. */
  year: 53.8,
} as const;

export const MEMBERS = ['Rorit', 'Amazaurus', 'Eilon', 'Eter'] as const;
export type Member = (typeof MEMBERS)[number];
/** Each member's name colour in the chat. */
export const COLOURS: Record<Member, string> = {
  Rorit: '#ff9c8f',
  Amazaurus: '#5fd3c4',
  Eilon: '#ffd36b',
  Eter: '#9fe08a',
};
/** The phones' clock before the first message. */
export const START_CLOCK = '9:01';

/** "DevOps 🦖", the group chat. */
export const CHAT: readonly (TimedChatLine & { from: Member })[] = [
  {
    at: 11.6,
    time: '9:02',
    from: 'Rorit',
    text: '🚨 Email from Chuks: Narnia compliance. New domain name for EVERYTHING',
  },
  { at: 13.6, time: '9:02', from: 'Amazaurus', text: '200 microservices. 200 certs to reissue 😬' },
  { at: 15.4, time: '9:03', from: 'Eilon', text: 'and the domain is hardcoded… everywhere 😅' },
  { at: 17.2, time: '9:03', from: 'Rorit', text: 'Eter, you lead it 🦁' },
  { at: 19.2, time: '9:03', from: 'Eter', text: 'On it. Yashinozarus, get us the name approved 🙏' },
];

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 8.8, to: 9.8, who: 'Rorit', text: 'Narnia?! 😱' },
  { from: 24.2, to: 26.6, who: 'Yashinozarus', text: 'Upper management approved. 24 hours ✅' },
  { from: 29.2, to: 32.0, who: 'Eter', text: 'Easy part’s done. Now… 200 certs 😰' },
  { from: 37.0, to: 39.6, who: 'Rorit', text: 'Who hardcoded the domain 4,812 times?! 😱' },
  { from: 47.8, to: 50.2, who: 'Eter', text: 'Lulu… when will we be Narnia compliant? 😩' },
  { from: 50.6, to: 53.8, who: 'Lulu', text: 'We’ll be compliant to Narnia in year 20666. No worries 😎' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 47);
export const speaking = (who: keyof typeof OFFICE_VOICES, t: number) =>
  LINES.some(l => l.who === who && t >= l.from && t < l.to);

/** Yashinozarus's terminal: the name, approved in a day; then the size of the real job. */
export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: 21.2, text: '› approvals request papopako.narnia', kind: 'prompt', cps: 16 },
  { at: 22.8, text: '⏳ sent to upper management…', kind: 'dim' },
  { at: 23.6, text: '✓ approved in 24 h ✅', kind: 'ok' },
  { at: 26.8, text: '› grep -rl papopako.io | wc -l', kind: 'prompt', cps: 18 },
  { at: 28.1, text: '4812 😱', kind: 'err' },
];

/** Days in a year, and how long the grind has gone on (days) when Lulu walks in. */
const YEAR_DAYS = 365;
const LONGEST_GRIND_DAYS = 3 * YEAR_DAYS;
/** The year Lulu promises. */
export const COMPLIANT_YEAR = 20666;

/** What Eter's desk calendar says at t: day 1, then days and years flying by in the grind, then Lulu's year. */
export function calendarAt(t: number): string {
  if (t >= CUE.year) return `${COMPLIANT_YEAR} 🤘`;
  const k = Math.min(1, Math.max(0, (t - CUE.grind[0]) / (CUE.grind[1] - CUE.grind[0])));
  // the days speed up as it drags on: exponential, from day 1 to three years
  const days = Math.max(1, Math.round(Math.exp(k * Math.log(LONGEST_GRIND_DAYS))));
  return days < YEAR_DAYS ? `Day ${days}` : `Year ${Math.floor(days / YEAR_DAYS)}`;
}

/** Where we are: the DevOps floor, or Yashinozarus's corner. */
export type Where = 'floor' | 'yashi';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'floor'],
  [CUE.yashi[0], 'yashi'],
  [CUE.yashi[1], 'floor'],
];
