import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';
import type { TimedChatLine } from '../../props/phone';

// Lulu, on her way out to the office, gets an SOS on the office group chat: Rorit, fresh out of the gym, forgot
// her protein bar. Lulu grabs one from her stash and brings it in; then the three of them (Rorit, Silvi and Lulu)
// sit on the bench outside the Papo Pako Shapeworks HQ and gossip. Times are video seconds. No music: natural sound.

export const DURATION = 52; // then the end card, see ../outro.ts

export const CUE = {
  door: [0, 4.6], // Lulu heading for the front door
  buzz: 2.6, // her phone goes off
  chat: [4.6, 15.6], // the SOS, on her phone
  reaction: [12.9, 13.7], // "Silvi. that is not protein": Lulu's face
  stash: [15.6, 21.6], // the emergency protein stash
  grab: 17.2,
  raise: 18.4, // held up high
  arrive: [21.6, 27.4], // the campus; Lulu walks up to the bench
  establish: 25.6, // a long look at the HQ (and the birds), then cut to the bench
  handoff: [27.4, 31.2],
  give: 28.0,
  tear: 28.8,
  chomp: [29.2, 30.7], // Rorit inhales it
  seat: [29.6, 31.0], // Lulu goes and sits down
  gossip: [31.2, 49.2],
  gasp: 41.6,
  end: [49.2, 52],
} as const;

export const MEMBERS = ['Rorit', 'Silvi', 'Lulu'] as const;
export type Member = (typeof MEMBERS)[number];

export const COLOURS: Record<Member, string> = {
  Rorit: '#7fe0a8',
  Silvi: '#ff9ec4',
  Lulu: '#c9a7ff',
};

/** The phones' clock before the first message. */
export const START_CLOCK = '8:44';

export interface ChatMessage extends TimedChatLine {
  from: Member;
}

/** "Office Besties", the group chat. */
export const CHAT: readonly ChatMessage[] = [
  { at: 5.2, time: '8:45', from: 'Rorit', text: 'SOS 🚨🚨' },
  { at: 7.0, time: '8:45', from: 'Rorit', text: 'just finished at the gym. forgot my protein bar 😭' },
  { at: 9.0, time: '8:45', from: 'Rorit', text: 'no protein in 30 min = my gains are GONE' },
  { at: 11.0, time: '8:46', from: 'Silvi', text: 'omg 😱 I have kombucha and good vibes ✨' },
  { at: 12.8, time: '8:46', from: 'Rorit', text: 'Silvi. that is not protein 💀' },
  { at: 14.8, time: '8:46', from: 'Lulu', text: 'say no more 💪 bringing one' },
];

/** Someone talking on the bench: their line (shown as a caption) and how long they talk. */
export type Line = SpokenLine<Member>;

/** The gossip, then the last word. */
export const LINES: readonly Line[] = [
  { from: 31.4, to: 34.4, who: 'Silvi', text: 'Okay. Did you hear about the 3rd floor? 👀' },
  { from: 34.8, to: 37.8, who: 'Rorit', text: 'The new VP?! Tell me EVERYTHING' },
  { from: 38.2, to: 41.4, who: 'Silvi', text: 'He cancelled pizza Friday 🍕' },
  { from: 43.6, to: 46.6, who: 'Lulu', text: 'I’m writing him a death metal ballad 🤘' },
  { from: 46.8, to: 49.0, who: 'Silvi', text: 'Leave it to me. Wellbeing is my job 💅' },
  { from: 49.4, to: 51.8, who: 'Rorit', text: 'So… same time tomorrow? 🥺' },
];

/** Each voice's pitches (low to high): Lulu's low and warm, Silvi's bright, Rorit's quick and high. */
const VOICES: Record<Member, Voice> = {
  Lulu: { notes: ['F3', 'G3', 'A3', 'C4'], rate: 0.17 },
  Silvi: { notes: ['C4', 'D4', 'E4', 'G4'], rate: 0.15 },
  Rorit: { notes: ['F4', 'G4', 'A4', 'C5'], rate: 0.12 },
};

/** Every syllable of everyone's lines, in order: what the voices sing and what the mouths do. */
export const SYLLABLES = syllables(LINES, VOICES);

export const mouthAt = (who: Member, t: number) => mouthOf(SYLLABLES, who, t);

export const speakerAt = (t: number): Member | null => speakerOf(LINES, t);
