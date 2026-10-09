import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';
import type { TimedChatLine } from '../../props/phone';

// Tiki Taka broke his arm playing in the dads' football league, and the band has a big gig next week. Lulu DMs her
// teammate Omli (very muscular, bald, a black PANTERA tee) in the middle of his workout: audition tomorrow? Next day
// he plays a heavy groove riff alone, Lulu can't help joining on drums, then Rory on guitar. Times are video seconds.

export const DURATION = 47; // then the end card, see ../outro.ts

/** The audition's music: 100 BPM, 4/4. A bar is 2.4 s; the song starts at `MUSIC_AT`. */
export const BPM = 100;
export const BAR = (60 / BPM) * 4;
export const MUSIC_AT = 17.5;
/** Bars of the song: Omli alone, then Lulu, then Rory; the last hit. */
export const BARS = { drumsIn: 3, guitarIn: 6, lastHit: 9 } as const;
const bar = (n: number) => MUSIC_AT + n * BAR;

export const CUE = {
  gym: [0, 15], // Omli's home gym: curls, then Lulu's DM
  buzz: 2.8,
  pickUp: 3.2,
  pov: 3.8, // over his shoulder… through his eyes, onto the chat
  grin: [9.7, 10.3], // "audition tomorrow?" He grins.
  flex: 14.1,
  audition: [15, 41.4],
  enter: 15, // Omli walks on
  solo: MUSIC_AT,
  drumsIn: bar(BARS.drumsIn),
  guitarIn: bar(BARS.guitarIn),
  lastHit: bar(BARS.lastHit),
  verdict: [41.4, DURATION],
} as const;

export const MEMBERS = ['Lulu', 'Omli'] as const;
export type Member = (typeof MEMBERS)[number];
export const COLOURS: Record<Member, string> = { Lulu: '#ff8fab', Omli: '#c89b6d' };
export const START_CLOCK = '18:40';

export interface ChatMessage extends TimedChatLine {
  from: Member;
}

/** Lulu's DM, on Omli's phone, mid-workout. */
export const CHAT: readonly ChatMessage[] = [
  { at: 4.2, time: '18:41', from: 'Lulu', text: 'Omli!! emergency 🚨' },
  { at: 6.0, time: '18:41', from: 'Lulu', text: 'Tiki Taka broke his arm 🤕 (dads league)' },
  { at: 7.8, time: '18:41', from: 'Lulu', text: 'we have a gig next week and no bassist 😭' },
  { at: 9.6, time: '18:42', from: 'Lulu', text: 'audition tomorrow? 🎸🙏' },
  { at: 11.4, time: '18:42', from: 'Omli', text: 'say less 🤘' },
  { at: 13.1, time: '18:42', from: 'Lulu', text: 'bring the muscles 💪😂' },
];

export type Who = 'Rory' | 'Tiki Taka';
export const LINES: readonly SpokenLine<Who>[] = [
  { from: 41.6, to: 43.6, who: 'Rory', text: 'You’re IN! 🤘' },
  { from: 44.0, to: 46.6, who: 'Tiki Taka', text: '…temporarily. 😤' },
];
export const VOICES: Record<Who, Voice> = {
  Rory: { notes: ['E4', 'G4', 'A4', 'B4'], rate: 0.13 },
  'Tiki Taka': { notes: ['G3', 'A3', 'B3', 'D4'], rate: 0.16 },
};
export const SYLLABLES = syllables(LINES, VOICES, 7);
export const mouthAt = (who: Who, t: number) => mouthOf(SYLLABLES, who, t);
export const speakerAt = (t: number): Who | null => speakerOf(LINES, t);
