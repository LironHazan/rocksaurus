import { beatPulse } from '../../band/timing';
import type { Caption } from '../../engine/types';

// Lulu On Call: one day (and night) in the life of a drummer who codes.
// Every time in this folder is in story seconds; the video plays the story PACE times slower
// (so tweak PACE to change the overall speed). Each scene has its own drum tempo.

/** Video seconds per story second. */
export const PACE = 1.35;

export type SceneId = 'office' | 'walk' | 'gains' | 'pilates' | 'night';

export interface SceneSpan {
  id: SceneId;
  from: number;
  to: number;
  /** Tempo of Lulu's background drums in this scene. */
  bpm: number;
}

export const SCENES: readonly SceneSpan[] = [
  { id: 'office', from: 0, to: 16, bpm: 85 }, // lo-fi groove at the desk
  { id: 'walk', from: 16, to: 32, bpm: 140 }, // marching home, one stomp per beat
  { id: 'gains', from: 32, to: 42, bpm: 100 }, // protein shake funk
  { id: 'pilates', from: 42, to: 54, bpm: 70 }, // slow and controlled
  { id: 'night', from: 54, to: 76, bpm: 60 }, // asleep… until the pager
];

const WALK = SCENES.find(s => s.id === 'walk')!;
/** How long the walk home actually plays (story seconds). The rest of its time slot is skipped. */
const WALK_LEN = 10;
/** Where the played walk ends, in script time. */
export const WALK_END = WALK.from + WALK_LEN;
/** How much of the script is skipped after the walk: everything later moves up by this much. */
export const SKIPPED = WALK.to - WALK_END;

/**
 * Times everywhere else in this folder are "script time", as if the walk lasted its full slot. These two convert
 * to and from what is actually played, so the later scenes can keep their own numbers.
 */
export const playedTime = (script: number): number =>
  script <= WALK_END ? script : script >= WALK.to ? script - SKIPPED : WALK_END;
export const scriptTime = (played: number): number => (played <= WALK_END ? played : played + SKIPPED);

/** Captions written in script time, moved to when they are actually shown (those in the skipped stretch are dropped). */
export const playedCaptions = (captions: readonly Caption[]): Caption[] =>
  captions.flatMap(c => {
    const from = playedTime(c.from),
      to = playedTime(c.to);
    return to > from ? [{ ...c, from, to }] : [];
  });

/** Story length in script time (story seconds). */
export const STORY_END = 76;
/** Video length in seconds. */
export const DURATION = (STORY_END - SKIPPED) * PACE;

/** Story beats inside the scenes. */
export const CUE = {
  typeFrom: 6.8, // office: types the task for the agent
  airDrum: 10.6, // office: the agent works, she drums on the desk
  logOff: 13.6, // office: stands up, waves, walks off
  walkStart: 16 + (2 * 60) / 140, // on a beat of the walk tempo
  walkStop: 16 + (19 * 60) / 140, // she arrives, turns to the door
  walkShots: [17.9, 20.8, 23.4], // camera: wide → close → low (she's huge) → wide again
  grab: 33.4, // gains: reels the shaker in from the counter
  shake: 34.4, // gains: shakes the shaker
  drink: 37.2, // gains: chugs it
  flex: 40.6,
  stretch: 44.4, // pilates: neck stretches
  hundred: 48.2, // pilates: lies back for "the hundred"
  page: 60, // night: the pager goes off
  blast: 61.2, // night: panic blast beat starts
  laptop: 63.2, // night: laptop open, types to the agent
  blame: 73.4, // night: ba-dum-tss
} as const;

export function sceneAt(t: number): SceneSpan {
  return SCENES.find(s => t < s.to) ?? SCENES[SCENES.length - 1]!;
}

/** Beat phase in the scene's tempo: 1 on each beat, decaying to 0 before the next. */
export const scenePulse = (t: number, scene: SceneSpan): number => beatPulse(t - scene.from, 60 / scene.bpm);
