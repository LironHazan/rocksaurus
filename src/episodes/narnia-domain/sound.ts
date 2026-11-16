import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import * as fx from '../../audio/foley';
import { keystrokes } from '../../world/screen-script';
import { CUE, CUTS, DURATION, YASHI_SCRIPT, calendarAt } from './timeline';

// No music, and no alert sounds (no dings, buzzes or chat pops): the office. Its hush; Rorit's click on the email;
// Yashinozarus's keys; the grind (four keyboards going at once, the calendar's pages flying); Lulu's steps; and a
// sparkle on the year 20666.

type Kind = 'click' | 'key' | 'flip' | 'step' | 'sparkle';

/** Lulu's steps (seconds apart), the grind's keys (seconds apart: four of them typing), and the fastest the
 * calendar's pages are heard turning (seconds apart). */
const LULU_STEP = 0.5;
const GRIND_KEYS = 0.09;
const FLIP_GAP = 0.18;
/** How finely the calendar is checked for a new page (seconds). */
const FLIP_SCAN = 0.02;

/** Whether t is at `where` (keys are only heard in the room you're in). */
const shownAt = (t: number, where: (typeof CUTS)[number][1]) => CUTS.findLast(([at]) => at <= t)?.[1] === where;

/** Each time the calendar shows a new page while she waits, no closer together than FLIP_GAP. */
function flips(): number[] {
  const out: number[] = [];
  let shown = calendarAt(CUE.grind[0]);
  for (let t = CUE.grind[0]; t < CUE.grind[1]; t += FLIP_SCAN) {
    const now = calendarAt(t);
    if (now === shown) continue;
    shown = now;
    if (out.length === 0 || t - out.at(-1)! >= FLIP_GAP) out.push(t);
  }
  return out;
}

function cues(): Cue<Kind>[] {
  return [
    { at: CUE.open, kind: 'click' },
    ...keystrokes(YASHI_SCRIPT)
      .filter(t => shownAt(t, 'yashi'))
      .map(at => ({ at, kind: 'key' as const })),
    ...every(CUE.grind[0], CUE.grind[1], GRIND_KEYS).map(at => ({ at, kind: 'key' as const })),
    ...flips().map(at => ({ at, kind: 'flip' as const })),
    ...every(CUE.lulu[0], CUE.lulu[1], LULU_STEP).map(at => ({ at, kind: 'step' as const })),
    { at: CUE.year, kind: 'sparkle' },
  ];
}

const PLAYERS: Record<Kind, Player> = {
  click: fx.tick,
  key: (b, w) => fx.keyTap(quieter(b, 0.5), w),
  flip: (b, w) => fx.page(quieter(b, 0.6), w),
  step: (b, w) => fx.footstep(quieter(b, 0.6), w),
  sparkle: fx.sparkle,
};

/** The office's sound; index.ts plays it with their voices. */
export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [{ from: 0, to: DURATION, kind: 'room' }],
});
