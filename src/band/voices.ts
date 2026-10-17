import type { Voice } from '../audio/babble';

/** How the trio sound when they talk (babble): Rory in the middle, Lulu up a little and quicker, Tiki Taka low. */
export const TRIO_VOICES = {
  Rory: { notes: ['G3', 'A3', 'C4', 'D4'], rate: 0.13 },
  Lulu: { notes: ['F3', 'G3', 'A3', 'C4'], rate: 0.17 },
  Tiki: { notes: ['C3', 'D3', 'F3', 'G3'], rate: 0.15 },
} as const satisfies Record<string, Voice>;
export type Trio = keyof typeof TRIO_VOICES;
