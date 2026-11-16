import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';
import type { TimedChatLine } from '../../props/phone';
import type { ScriptLine } from '../../world/screen-script';

// The DevOps floor at Papo Pako Shapeworks, 9 AM. An email from Chuks lands on Rorit's screen: Narnia compliance, every
// service needs a new, Narnia-approved domain name. Rorit alerts the DevOps group chat; Amazaurus and Eilon are in the
// loop (Amazaurus does the maths: 200 microservices behind that domain, 200 certs to replace), and
// Eter takes the lead. Her plan is ready; all she needs is the name, from Yashinozarus. He needs approval
// from upper management. She waits. And waits. Then Lulu walks by: "We'll be compliant to Narnia in year 20666. No
// worries." Times are video seconds. No music: the office.

export const DURATION = 56; // then the end card, see ../outro.ts

export const CUE = {
  /** The email lands on Rorit's monitor, and she opens it. */
  mail: 3.6,
  open: 4.6,
  /** Her face, and the phone comes out. */
  gasp: 8.6,
  phoneOut: 9.6,
  /** The group chat, on everyone's phones. */
  chat: [10.0, 20.6],
  /** Eter at her desk: the Narnia plan, the blank where the name goes. */
  board: [20.6, 27.0],
  /** Meanwhile, Yashinozarus. */
  yashi: [27.0, 37.0],
  /** She waits: the desk calendar flies. */
  wait: [37.0, 45.0],
  /** Lulu walks over to her desk. */
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
  { at: 11.6, time: '9:02', from: 'Rorit', text: '🚨 Email from Chuks: Narnia compliance. We need a NEW domain name' },
  { at: 13.6, time: '9:02', from: 'Amazaurus', text: 'Mm. 200 microservices behind that domain. 200 certs 🙂' },
  { at: 15.4, time: '9:03', from: 'Eilon', text: 'Love it!! 😄🎉' },
  { at: 17.2, time: '9:03', from: 'Rorit', text: 'Eter, you lead it 🦁' },
  { at: 19.2, time: '9:03', from: 'Eter', text: 'On it 💪 Waiting on Yashinozarus for the name' },
];

export const LINES: readonly SpokenLine<keyof typeof OFFICE_VOICES>[] = [
  { from: 8.8, to: 9.8, who: 'Rorit', text: 'Narnia?! 😱' },
  { from: 21.4, to: 24.2, who: 'Eter', text: 'Plan’s ready. Just need the name ⏳' },
  { from: 31.6, to: 34.4, who: 'Yashinozarus', text: 'I need approval from upper management 🧐' },
  { from: 47.8, to: 50.2, who: 'Eter', text: 'Lulu… when will we be Narnia compliant? 😩' },
  { from: 50.6, to: 53.8, who: 'Lulu', text: 'We’ll be compliant to Narnia in year 20666. No worries 😎' },
];

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, OFFICE_VOICES, 47);
export const speaking = (who: keyof typeof OFFICE_VOICES, t: number) =>
  LINES.some(l => l.who === who && t >= l.from && t < l.to);

/** Yashinozarus's terminal: the name is ready; the approval is not. */
export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: 27.6, text: '› domains propose --for narnia', kind: 'prompt', cps: 14 },
  { at: 29.6, text: '✓ papopako.narnia 🦁 · available', kind: 'ok' },
  { at: 30.0, text: '  200 services · 200 certs to reissue', kind: 'dim' },
  { at: 30.6, text: '✗ needs approval: upper management', kind: 'err' },
  { at: 34.8, text: '› approvals status UPMGMT-1', kind: 'prompt', cps: 16 },
  { at: 36.2, text: '⏳ pending · approver last seen 2019', kind: 'dim' },
];

/** Days in a year, and the most the waiting gets to (days) before Lulu walks in. */
const YEAR_DAYS = 365;
const LONGEST_WAIT_DAYS = 12 * YEAR_DAYS;
/** The year Lulu promises. */
export const COMPLIANT_YEAR = 20666;

/** What Eter's desk calendar says at t: day 1, then days and years flying by while she waits, then Lulu's year. */
export function calendarAt(t: number): string {
  if (t >= CUE.year) return `${COMPLIANT_YEAR} 🤘`;
  const k = Math.min(1, Math.max(0, (t - CUE.wait[0]) / (CUE.wait[1] - CUE.wait[0])));
  // the days speed up as she waits: exponential, from day 1 to twelve years
  const days = Math.max(1, Math.round(Math.exp(k * Math.log(LONGEST_WAIT_DAYS))));
  return days < YEAR_DAYS ? `Day ${days}` : `Year ${Math.floor(days / YEAR_DAYS)}`;
}

/** Where we are: the DevOps floor, or Yashinozarus's corner. */
export type Where = 'floor' | 'yashi';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'floor'],
  [CUE.yashi[0], 'yashi'],
  [CUE.yashi[1], 'floor'],
];
