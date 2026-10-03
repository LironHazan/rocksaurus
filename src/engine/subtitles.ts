import type { Caption } from './types';

// Subtitle style: everything is left-aligned at the bottom, so the middle of the frame stays clear.
// Each scene opens with a title card, then a subtitle explains what's going on, with a metal punchline
// on the line under it.

const LINE_1 = 0.85; // title cards and subtitles, at the bottom of the frame
const LINE_2 = 0.925; // punchlines, under them
const TITLE_Y = 0.89; // two-line scene titles, centered between the two lines (shown before any punchline)
const BASE = { align: 'left' } as const;
/** A scene title card (two lines, e.g. '🏢 THE OFFICE\\n5:58 PM'). */
export const title = (from: number, to: number, text: string): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: TITLE_Y,
  size: 0.078,
  color: '#ffe08a',
});
/** A subtitle: what's going on. */
export const sub = (from: number, to: number, text: string, extra: Partial<Caption> = {}): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: LINE_1,
  size: 0.062,
  ...extra,
});
/** The punchline under a subtitle. */
export const punch = (from: number, to: number, text: string, extra: Partial<Caption> = {}): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: LINE_2,
  size: 0.054,
  color: '#c9f2ff',
  ...extra,
});

/** Captions written in story seconds, played `pace` times slower. */
export const atPace = (captions: readonly Caption[], pace: number): Caption[] =>
  captions.map(c => ({ ...c, from: c.from * pace, to: c.to * pace }));
