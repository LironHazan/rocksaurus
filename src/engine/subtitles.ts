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

/** Top-left captions: titles, subtitles and lines high up (the owner's call: above the Shorts safe area, which
 * starts at 0.17), punchlines under them. Heights are fractions of the frame; a caption is centred on its height. */
const TOP_LEFT = { top: 0.12, under: 0.225 } as const;
/** Punchlines are written lowest (under the titles and subtitles): anything below this moves under the top line. */
const BELOW_SUBTITLES = (TITLE_Y + LINE_2) / 2;
/** A dark, see-through box behind each boxed caption, so it reads over a busy shot. */
const TOP_LEFT_BACKDROP = 'rgba(16, 18, 30, 0.62)';

/** On boxes at the bottom, titles and subtitles sit a little higher than usual, so a two-line subtitle's box
 * clears the punchline's under it. */
const BOXED_LINE_1 = 0.82;

/** Captions on their dark boxes, with titles and subtitles at `top` and punchlines at `under` (frame heights). */
const boxed = (captions: readonly Caption[], top: number, under: number): Caption[] =>
  captions.map(c => ({ ...c, y: (c.y ?? 0) > BELOW_SUBTITLES ? under : top, backdrop: TOP_LEFT_BACKDROP }));

/**
 * Captions written with `title`/`sub`/`punch` at the bottom, moved to the top left of the frame, each on a dark box:
 * clear of the action at the bottom of each shot.
 */
export const topLeft = (captions: readonly Caption[]): Caption[] => boxed(captions, TOP_LEFT.top, TOP_LEFT.under);

/** Captions left at the bottom, each on a dark box so it reads over a busy shot. */
export const boxedAtBottom = (captions: readonly Caption[]): Caption[] => boxed(captions, BOXED_LINE_1, LINE_2);
