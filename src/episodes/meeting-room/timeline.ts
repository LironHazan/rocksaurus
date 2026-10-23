import { speech, type SpokenLine } from '../../audio/babble';
import { OFFICE_VOICES } from '../../characters/coworkers';

// Another day at Papo Pako Shapeworks. Statitezarus, from the agentic AI team, wants his design reviewed: he posts it
// in 5 different chat channels and tags the same two dinos every time, Dchozaurus and Igarzarus. In the meeting
// room (Dchozaurus is remote, on the screen), Igarzarus asks what he asks at every opportunity: when can we port it
// from Ruby to Elm? Dchozaurus: port the tests and guardrails first, will you? Then he jumps: "I have a bug!"
// Igarzarus: "You, or the 666 agents factory factory factory factory?" No: there's a bug ON THE FLOOR. Ogozaurus walks in: "Everything reached prod now?" Lulu has
// no idea what's going on. Times are video seconds. No music: natural sound.

export const DURATION = 56; // then the end card, see ../outro.ts

export const CUE = {
  campus: [0, 4.2], // the Papo Pako Shapeworks campus, morning
  room: 4.2, // the meeting room
  posts: [5.6, 7.2, 8.8, 10.4, 12.0], // Statitezarus posts the design: one channel after another
  tagged: [13.4, 16.6], // the same two dinos, tagged five times
  bug: 33.0, // Dchozaurus jumps up on his chair
  floor: [38.6, 43.4], // the bug on his floor
  door: 43.6, // Ogozaurus opens the door
  inside: 45.4, // and walks in
  confused: [49.6, 56], // Lulu
} as const;

/** The channels he posts in, in order (one per CUE.posts). */
export const CHANNELS = ['agentic-ai', 'design-review', 'architecture', 'platform', 'random'] as const;
/** How many channels he has posted in by t. */
export const postsAt = (t: number): number => CUE.posts.filter(p => t >= p).length;

const CAST = ['Statitezarus', 'Igarzarus', 'Dchozaurus', 'Ogozaurus', 'Lulu'] as const;
export type Who = (typeof CAST)[number];

export const LINES: readonly SpokenLine<Who>[] = [
  { from: 17.0, to: 20.2, who: 'Statitezarus', text: 'So… any thoughts on my design? 🙏' },
  { from: 20.8, to: 24.6, who: 'Igarzarus', text: 'When can we port it from Ruby to Elm?' },
  { from: 28.2, to: 32.4, who: 'Dchozaurus', text: 'Port the tests and guardrails first, will you?' },
  { from: 33.4, to: 35.2, who: 'Dchozaurus', text: 'I HAVE A BUG!!' },
  { from: 35.4, to: 38.6, who: 'Igarzarus', text: 'You, or the 666 agents factory factory factory factory? 😈' },
  { from: 38.8, to: 42.2, who: 'Dchozaurus', text: 'There’s a bug ON THE FLOOR!! 🪲' },
  { from: 45.8, to: 49.2, who: 'Ogozaurus', text: 'Everything reached prod now? 🚀' },
];

export const { syllables: SYLLABLES, mouthAt, speakerAt } = speech(LINES, OFFICE_VOICES, 57);

/** Where we are: the campus, then the meeting room. */
export type Where = 'campus' | 'room';
export const CUTS: readonly (readonly [number, Where])[] = [
  [0, 'campus'],
  [CUE.room, 'room'],
];
