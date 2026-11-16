import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';
import type { TimedChatLine } from '../../props/phone';
import type { ScriptLine } from '../../world/screen-script';

// The DevOps floor at Papo Pako Shapeworks, 9 AM. An email from Chuks lands on Rorit's screen: Narnia compliance, a
// new, Narnia-approved domain name for everything: papopakoshapeworks.com becomes papopakoshapeworks.na. She alerts the DevOps group chat: Amazaurus does the maths (200
// microservices, 200 certs to reissue), Eilon remembers the domain is hardcoded everywhere, and Eter takes the lead.
// Yashinozarus gets the name approved by upper management in 24 hours: the easy part. Then the real DevOps pain:
// 200 certs, one by one, and 4,812 hardcoded domains to replace, and all four of them in it, stressed, for months.
// Then Lulu walks by: "We'll be compliant to Narnia in year 20666. No worries." Times are video seconds. No music.

export const DURATION = 78; // then the end card, see ../outro.ts

export const CUE = {
  /** The email lands on Rorit's monitor, and she opens it. */
  mail: 5.0,
  open: 6.4,
  /** Her face, and the phone comes out: from here on, they're all stressed. */
  gasp: 12.0,
  phoneOut: 13.4,
  /** The group chat, on everyone's phones. */
  chat: [14.0, 28.8],
  /** Yashinozarus: the name, approved in 24 hours. */
  yashi: [28.8, 40.0],
  /** Eter at her desk: the plan, and what's left on it. */
  board: [40.0, 46.2],
  /** The grind: 200 certs and 4,812 hardcoded domains, all four of them typing, for months. */
  grind: [46.2, 63.0],
  /** Lulu walks over to Eter's desk. */
  lulu: [63.0, 66.6],
  /** The calendar lands on the year Lulu names. */
  year: 75.3,
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
    at: 16.2,
    time: '9:02',
    from: 'Rorit',
    text: '🚨 Email from Chuks: Narnia compliance. papopakoshapeworks.com → papopakoshapeworks.na. EVERYTHING',
  },
  { at: 19.0, time: '9:02', from: 'Amazaurus', text: '200 microservices. 200 certs to reissue 😬' },
  { at: 21.6, time: '9:03', from: 'Eilon', text: 'and the domain is hardcoded… everywhere 😅' },
  { at: 24.1, time: '9:03', from: 'Rorit', text: 'Eter, you lead it 🦁' },
  { at: 26.9, time: '9:03', from: 'Eter', text: 'On it. Yashinozarus, get us the name approved 🙏' },
];

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 12.3, to: 13.7, who: 'Rorit', text: 'Narnia?! 😱' },
  { from: 33.9, to: 37.2, who: 'Yashinozarus', text: 'Upper management approved. 24 hours ✅' },
  { from: 40.9, to: 44.8, who: 'Eter', text: 'Easy part’s done. Now… 200 certs 😰' },
  { from: 51.8, to: 55.4, who: 'Rorit', text: 'Who hardcoded the domain 4,812 times?! 😱' },
  { from: 66.9, to: 70.3, who: 'Eter', text: 'Lulu… when will we be Narnia compliant? 😩' },
  { from: 70.8, to: 75.3, who: 'Lulu', text: 'We’ll be compliant to Narnia in year 20666. No worries 😎' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 47);
export const speaking = (who: keyof typeof OFFICE_VOICES, t: number) =>
  LINES.some(l => l.who === who && t >= l.from && t < l.to);

/** Yashinozarus's terminal: the name, approved in a day; then the size of the real job. */
export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0.0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: 29.7, text: '› approve papopakoshapeworks.na', kind: 'prompt', cps: 16 },
  { at: 31.9, text: '⏳ sent to upper management…', kind: 'dim' },
  { at: 33.0, text: '✓ approved in 24 h ✅', kind: 'ok' },
  { at: 37.5, text: '› grep -rl papopakoshapeworks.com | wc -l', kind: 'prompt', cps: 18 },
  { at: 39.3, text: '4812 😱', kind: 'err' },
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
