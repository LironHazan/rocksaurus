import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';

// 8:30 AM. Rorit drives to work in her Fesla, just upgraded to Frok bot, and she gave it permissions to everything
// in her daily workflow. Stuck in traffic, she calls Lulu to gossip about it, hands-free. Then Amazarus calls: the
// new infra won't be ready on time for validations; IT approved his ticket and asked him to open 2 more tickets for
// the actual work. He's not so calm anymore (red face). Frok hears "open tickets" and, with permissions to
// everything, goes wild: it opens thousands of them, all for Amazarus. Lulu comes to his cube with tea: "Amazarus,
// chill. Let me escalate, I'm still a manager by title", and she laughs. Frok escalated too. Times are video
// seconds. No music: natural sound, the car, the office, the phones.

export const DURATION = 59; // then the end card, see ../outro.ts

export const CUE = {
  drive: [0, 9.2], // the jam; the Fesla's screen: Frok installed
  install: 2.8, // the screen lights up
  perms: [3.6, 7.0], // a ✅ for each permission, everything last
  dial: 7.6, // she calls Lulu: it rings
  answer: 9.0,
  sidewalk: [18.8, 20.6], // Frok has an idea
  waiting: 22.4, // call waiting: Amazarus
  amaz: [25.2, 36.6], // Amazarus in his cube, on the phone
  red: [29.0, 36.2], // his face goes red, from "IT approved" to "the actual work!"
  wild: [36.6, 43.6], // Frok heard "open tickets"
  onIt: 37.0,
  flood: [38.4, 42.4], // the ticket counter runs; hazards, horn
  swamped: [43.6, 45.4], // his monitor fills with tickets: tomato red, steam
  cube: [45.4, 56.4], // Lulu brings tea
  arrive: 47.4, // she's at the cube
  laugh: [53.4, 54.6],
  give: 54.6, // the tea changes paws
  sip: 55.4,
  tag: [56.4, 59], // the Fesla: Frok escalated too
} as const;

/** Where we are: in the Fesla, or at the office (Lulu at her desk, Amazarus in his cube). */
export type Where = 'car' | 'office';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'car'],
  [12.6, 'office'], // Lulu picks up
  [15.6, 'car'],
  [CUE.amaz[0], 'office'],
  [CUE.wild[0], 'car'],
  [CUE.swamped[0], 'office'],
  [CUE.tag[0], 'car'],
];
/** Where we are at t. */
export const whereAt = (t: number): Where => CUTS.findLast(([from]) => t >= from)?.[1] ?? 'car';

/** The permissions Rorit gave Frok, ticked one by one, from CUE.perms[0], every PERM_EVERY seconds. */
export const PERMISSIONS = ['Calendar', 'Email', 'Chats', 'Tickets', 'Bank', 'EVERYTHING'] as const;
export const PERM_EVERY = (CUE.perms[1] - CUE.perms[0]) / PERMISSIONS.length;

/** The tickets Frok opens: doubling, from 2 to this many, while the counter runs. */
export const TICKETS_MAX = 4096;
export const ticketsAt = (t: number): number => {
  if (t < CUE.flood[0]) return 0;
  const k = Math.min(1, (t - CUE.flood[0]) / (CUE.flood[1] - CUE.flood[0] - 0.4));
  return 2 ** Math.round(1 + k * (Math.log2(TICKETS_MAX) - 1));
};
/** When the counter doubles (each one ticks). */
export const TICKET_TICKS: readonly number[] = (() => {
  const out: number[] = [];
  for (let t = CUE.flood[0], last = 0; t < CUE.flood[1]; t += 0.05) {
    const n = ticketsAt(t);
    if (n !== last) out.push(Math.round(t * 100) / 100);
    last = n;
  }
  return out;
})();

/** The Fesla's hazard lights blink this many times a second while Frok goes wild. */
const HAZARD_HZ = 3;
export const hazardOn = (t: number) => t >= CUE.flood[0] && t < CUE.wild[1] && Math.floor(t * HAZARD_HZ * 2) % 2 === 0;
/** Frok honks (on its own) at these times. */
export const HONKS = [38.7, 39.3, 39.6, 40.5, 41.2, 41.5, 42.1] as const;

const SPEAKERS = ['Rorit', 'Lulu', 'Amazarus'] as const;
export type Speaker = (typeof SPEAKERS)[number];

/** Someone talking: their line (shown as a caption) and how long they talk. */
export type Line = SpokenLine<Speaker>;

export const LINES: readonly Line[] = [
  { from: 9.4, to: 12.4, who: 'Rorit', text: 'Lulu! The highway is a parking lot 🚗🚗🚗' },
  { from: 12.8, to: 15.4, who: 'Lulu', text: 'Again?! Who’s blocking it today? 👀' },
  { from: 15.8, to: 18.6, who: 'Rorit', text: 'A minivan doing 12. In the fast lane 🙄' },
  { from: 20.8, to: 22.3, who: 'Rorit', text: 'No, Frok.' },
  { from: 22.8, to: 25.0, who: 'Rorit', text: 'Hold on, Amazarus is calling 📞' },
  { from: 25.4, to: 28.6, who: 'Amazarus', text: 'The new infra won’t be ready for validations 😬' },
  { from: 29.0, to: 32.0, who: 'Amazarus', text: 'IT approved my ticket…' },
  { from: 32.4, to: 34.6, who: 'Amazarus', text: '…and asked me to open 2 MORE tickets' },
  { from: 34.8, to: 36.4, who: 'Amazarus', text: 'For the actual work!! 🤬' },
  { from: 40.4, to: 42.4, who: 'Rorit', text: 'FROK, NO!!' },
  { from: 47.6, to: 49.4, who: 'Lulu', text: 'Amazarus, chill 🍵' },
  { from: 49.8, to: 53.4, who: 'Lulu', text: 'Let me escalate. I’m still a manager by title 😂' },
];

/** What Frok says, on the Fesla's screen (and as a caption): no voice, just its bleeps. */
export interface FrokLine {
  from: number;
  to: number;
  text: string;
}
export const FROK: readonly FrokLine[] = [
  { from: CUE.sidewalk[0], to: CUE.sidewalk[1], text: 'I could take the sidewalk 😈' },
  { from: CUE.onIt, to: CUE.flood[0], text: 'Tickets? On it! 🎫' },
  { from: CUE.tag[0] + 0.2, to: CUE.tag[1], text: 'Escalated it too ✅ To: EVERYONE 📣' },
];

/** Each voice (low to high): Amazarus low and steady (until he isn't), Lulu low and warm, Rorit quick and high. */
const VOICES: Record<Speaker, Voice> = {
  Amazarus: { notes: ['C3', 'D3', 'E3', 'G3'], rate: 0.16 },
  Lulu: { notes: ['F3', 'G3', 'A3', 'C4'], rate: 0.17 },
  Rorit: { notes: ['F4', 'G4', 'A4', 'C5'], rate: 0.12 },
};

/** Every syllable of everyone's lines, in order: what the voices sing and what the mouths do. */
export const SYLLABLES = syllables(LINES, VOICES, 41);

export const mouthAt = (who: Speaker, t: number) => mouthOf(SYLLABLES, who, t);

export const speakerAt = (t: number): Speaker | null => speakerOf(LINES, t);

/** How red Amazarus's face is (0..1): it builds through his call, peaks when the tickets land, and the tea cools it. */
export function redAt(t: number): number {
  const call = Math.min(1, Math.max(0, (t - CUE.red[0]) / (CUE.red[1] - CUE.red[0]))) * 0.75;
  const swamped = t >= CUE.swamped[0] ? 0.25 : 0;
  const cooled = Math.min(1, Math.max(0, (t - CUE.sip) / 1.0));
  return (call + swamped) * (1 - cooled);
}
