// Steggy & the Matcha Theory: a physicist with a PhD (still at Mom & Dad's) tries to write a very important
// article, his baby sister won't let him, so he goes to the coffee shop where Rory is the barista.
// All times are story seconds; the video plays PACE times slower. The music is a clean solo piano.

export type SceneId = 'room' | 'sister' | 'cafe';

export interface SceneSpan {
  id: SceneId;
  from: number;
  to: number;
}

export const PACE = 1.35;

export const SCENES: readonly SceneSpan[] = [
  { id: 'room', from: 0, to: 19 },
  { id: 'sister', from: 19, to: 31 },
  { id: 'cafe', from: 31, to: 43.5 },
];

export const STORY_END = 43.5;
export const DURATION = STORY_END * PACE;

export const CUE = {
  cds: [5.6, 10.6], // room: the camera glides along the CD wall
  typeFrom: 11, // room: starts typing the article
  sisterIn: 19.3, // sister: the door opens
  sisterArrive: 21.3,
  nudges: [21.9, 23.3, 24.4, 25.2, 25.8, 26.3],
  closeLid: 27.2,
  leave: 28.4, // walks out with the laptop…
  exit: 30.8, // …and is through the door
  enter: 31.3, // café: the door bell
  sit: 33.0,
  serve: [33.3, 35.5], // Rory carries two matcha from the bar to the table
  placeCups: 35.8,
  roryTakesSeat: 36.5,
  cheers: 37.3,
  sips: [38.4, 39.7],
  enjoy: 40.5, // ahh
} as const;

export function sceneAt(t: number): SceneSpan {
  return SCENES.find(s => t < s.to) ?? SCENES[SCENES.length - 1]!;
}
