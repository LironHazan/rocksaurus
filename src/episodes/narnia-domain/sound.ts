import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import * as fx from '../../audio/foley';
import { keystrokes } from '../../world/screen-script';
import { CUE, CUTS, DURATION, YASHI_SCRIPT } from './timeline';

// No music, and nothing that sounds like an alert or an incident (no dings, buzzes, chat pops or pagers): the street
// and her wheels outside; then the office's hush, Rorit's click on the email, Yashinozarus's keys, Lulu's steps, and a
// sparkle on the year 20666.

type Kind = 'roll' | 'click' | 'key' | 'step' | 'sparkle';

/** Lulu's steps (seconds apart). */
const LULU_STEP = 0.5;

/** Whether t is at `where` (keys are only heard in the room you're in). */
const shownAt = (t: number, where: (typeof CUTS)[number][1]) => CUTS.findLast(([at]) => at <= t)?.[1] === where;

function cues(): Cue<Kind>[] {
  return [
    { at: CUE.ride[0], kind: 'roll' },
    { at: CUE.open, kind: 'click' },
    ...keystrokes(YASHI_SCRIPT)
      .filter(t => shownAt(t, 'yashi'))
      .map(at => ({ at, kind: 'key' as const })),
    ...every(CUE.lulu[0], CUE.lulu[1], LULU_STEP).map(at => ({ at, kind: 'step' as const })),
    { at: CUE.year, kind: 'sparkle' },
  ];
}

const PLAYERS: Record<Kind, Player> = {
  roll: (b, w) => fx.swish(quieter(b, 0.5), w, CUE.ride[1] - CUE.ride[0]), // her wheels on the plaza
  click: fx.tick,
  key: (b, w) => fx.keyTap(quieter(b, 0.5), w),
  step: (b, w) => fx.footstep(quieter(b, 0.6), w),
  sparkle: fx.sparkle,
};

/** The office's sound; index.ts plays it with their voices. */
export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [
    { from: 0, to: CUE.campus[1], kind: 'street' },
    { from: CUE.campus[1], to: DURATION, kind: 'room' },
  ],
});
