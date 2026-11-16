import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';
import type { TimedChatLine } from '../../props/phone';
import type { ScriptLine } from '../../world/screen-script';
import type { HackMessage } from '../../world/hack-window';

// Papo Pako Shapeworks, 9 AM: Lulu skates up to the HQ and goes in. On the DevOps floor, an email from Chuks lands on
// Rorit's screen: Narnia compliance, papopakoshapeworks.com becomes papopakoshapeworks.na, for everything. She alerts
// the DevOps group chat: Amazaurus does the maths (200 microservices, 200 certs to reissue), Eilon remembers the
// domain is hardcoded everywhere, and Eter takes the lead. Yashinozarus asks upper management on Hack: approved, in 24
// hours. The easy part. Then the real DevOps pain: 200 certs, one by one, and 4,812 hardcoded domains to replace, all
// four of them in it, stressed, for months. Then Lulu walks by: "We'll be compliant to Narnia in year 20666. No
// worries." Times are video seconds. Slow on purpose, so an infra audience gets every beat. No music.

export const DURATION = 84; // then the end card, see ../outro.ts

export const CUE = {
  /** Outside the HQ: Lulu skates up to the doors and goes in. */
  campus: [0, 6.0],
  ride: [0.6, 5.8],
  /** The email lands on Rorit's monitor, and she opens it. */
  mail: 11.0,
  open: 12.4,
  /** Her face, and the phone comes out: from here on, they're all stressed. */
  gasp: 18.0,
  phoneOut: 19.4,
  /** The group chat, on everyone's phones. */
  chat: [20.0, 34.8],
  /** Yashinozarus: the name, approved in 24 hours. */
  yashi: [34.8, 46.0],
  /** Eter at her desk: the plan, and what's left on it. */
  board: [46.0, 52.2],
  /** The grind: 200 certs and 4,812 hardcoded domains, all four of them typing, for months. */
  grind: [52.2, 69.0],
  /** Lulu walks over to Eter's desk. */
  lulu: [69.0, 72.6],
  /** The calendar lands on the year Lulu names. */
  year: 81.3,
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
    at: 22.2,
    time: '9:02',
    from: 'Rorit',
    text: '🚨 Email from Chuks: Narnia compliance. papopakoshapeworks.com → papopakoshapeworks.na. EVERYTHING',
  },
  { at: 25.0, time: '9:02', from: 'Amazaurus', text: '200 microservices. 200 certs to reissue 😬' },
  { at: 27.6, time: '9:03', from: 'Eilon', text: 'and the domain is hardcoded… everywhere 😅' },
  { at: 30.1, time: '9:03', from: 'Rorit', text: 'Eter, you lead it 🦁' },
  { at: 32.9, time: '9:03', from: 'Eter', text: 'On it. Yashinozarus, get us the name approved 🙏' },
];

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 18.3, to: 19.7, who: 'Rorit', text: 'Narnia?! 😱' },
  { from: 39.9, to: 43.2, who: 'Yashinozarus', text: 'Upper management approved. 24 hours ✅' },
  { from: 46.9, to: 50.8, who: 'Eter', text: 'Easy part’s done. Now… 200 certs 😰' },
  { from: 57.8, to: 61.4, who: 'Rorit', text: 'Who hardcoded the domain 4,812 times?! 😱' },
  { from: 72.9, to: 76.3, who: 'Eter', text: 'Lulu… when will we be Narnia compliant? 😩' },
  { from: 76.8, to: 81.3, who: 'Lulu', text: 'We’ll be compliant to Narnia in year 20666. No worries 😎' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 47);
export const speaking = (who: keyof typeof OFFICE_VOICES, t: number) =>
  LINES.some(l => l.who === who && t >= l.from && t < l.to);

/** Yashinozarus asks upper management on Hack (the team chat): they approve the name. In 24 hours. */
export const UPPER_MANAGEMENT = 'Upper Mgmt';
export const HACK_DM: readonly HackMessage[] = [
  { who: 'Yashinozarus', text: 'Hi 👋 Can we approve our new domain for Narnia? 🙏', at: 35.7 },
  { who: 'Yashinozarus', text: 'papopakoshapeworks.na 🦁', at: 36.6 },
  { who: UPPER_MANAGEMENT, text: '👀 Looking into it', at: 37.6 },
  { who: UPPER_MANAGEMENT, text: '(24 hours later) Approved ✅', at: 39.0 },
];
/** Then, in his terminal, the size of the real job. */
export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0.0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: 43.5, text: '› grep -rl papopakoshapeworks.com | wc -l', kind: 'prompt', cps: 18 },
  { at: 45.3, text: '4812 😱', kind: 'err' },
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

/** Where we are: outside the HQ, the DevOps floor, or Yashinozarus's corner. */
export type Where = 'campus' | 'floor' | 'yashi';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'campus'],
  [CUE.campus[1], 'floor'],
  [CUE.yashi[0], 'yashi'],
  [CUE.yashi[1], 'floor'],
];
