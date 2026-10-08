import { TYPING, chatState, type TimedChatLine } from '../../props/phone';

// Monday morning: each parent drops their kid at a different school, and the group chat plans coffee. Rory
// sleeps through it; Lulu reads it on her therapist's couch. Times are video seconds. Paced so every message
// can be read. No music: the background track is added on YouTube.

export const DURATION = 55; // then the end card, see ../outro.ts

export const CUE = {
  // three drop-offs, three schools
  tikiSchool: [0, 2.6],
  parisSchool: [2.6, 5.2],
  steggySchool: [5.2, 7.8],
  ask: [7.8, 10.6], // back to Tiki: "coffeee?"
  // the debate, over each parent's shoulder in turn
  parisPhone: [10.6, 14.4],
  steggyPhone: [14.4, 18.0],
  tikiPhone: [18.0, 21.4],
  rory: [21.4, 26.4], // asleep, his phone buzzing on the nightstand
  therapy: [26.4, 41.6], // Lulu on the couch
  peek: 29.2, // she sneaks a look at her phone
  feel: 36.8, // "And how do you feel?"
  fomo: 38.0, // "FOMO. Severe FOMO."
  cafe: [41.6, 50.2], // the street café
  clink: 44.2,
  selfie: 45.8,
  end: 50.2, // Lulu gets the selfie
  flop: 51.8, // and flops back on the couch
} as const;

export const MEMBERS = ['Tiki Taka', 'Paris', 'Steggy', 'Lulu', 'Rory'] as const;
export type Member = (typeof MEMBERS)[number];

export const COLOURS: Record<Member, string> = {
  'Tiki Taka': '#53bdeb',
  Paris: '#d39bff',
  Steggy: '#ffc857',
  Lulu: '#ff8fab',
  Rory: '#7fd1ae',
};

export interface ChatMessage extends TimedChatLine {
  from: Member;
}

/** The phones' clock before the first message. */
export const START_CLOCK = '8:11';

/** "The Parliament", the parents' group chat. Each message pops up at `at`, after its sender types it. */
export const CHAT: readonly ChatMessage[] = [
  { at: 9.0, time: '8:12', from: 'Tiki Taka', text: 'coffeee? ☕' },
  { at: 11.6, time: '8:12', from: 'Paris', text: 'YES. black, like my soul 🖤' },
  { at: 13.4, time: '8:13', from: 'Steggy', text: 'matcha for me 🍵' },
  { at: 15.4, time: '8:13', from: 'Paris', text: 'the new café on Elm St?' },
  { at: 17.2, time: '8:13', from: 'Steggy', text: 'the one with the big chairs outside?' },
  { at: 19.2, time: '8:14', from: 'Tiki Taka', text: 'BIG CHAIRS 🦖🙏' },
  { at: 20.8, time: '8:14', from: 'Paris', text: '@Rory ?' },
  { at: 24.2, time: '8:15', from: 'Tiki Taka', text: 'he’s asleep lol 😴' },
  { at: 26.8, time: '8:15', from: 'Steggy', text: '@Lulu ? ☕' },
  { at: 31.2, time: '8:31', from: 'Lulu', text: 'guyssss 😤' },
  { at: 33.2, time: '8:31', from: 'Lulu', text: 'coffee on a MONDAY MORNING without me??' },
  { at: 35.2, time: '8:32', from: 'Lulu', text: 'I have FOMO!! 😩' },
  { at: 40.0, time: '8:33', from: 'Paris', text: 'we’ll save you a big chair 🪑' },
  { at: 46.8, time: '9:05', from: 'Paris', text: '📸 selfie from Elm St' },
  { at: 48.4, time: '9:05', from: 'Tiki Taka', text: 'miss u Lulu 😘' },
];

export { TYPING };

/** The chat at time t: what's been sent, what's being typed (and how much of it), and the arrival flash. */
export const chatAt = (t: number) => chatState(CHAT, t, START_CLOCK);
