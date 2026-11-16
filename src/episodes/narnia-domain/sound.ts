import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { chatPop, chatSent, ding } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { keystrokes } from '../../world/screen-script';
import { CHAT, CUE, CUTS, DURATION, YASHI_SCRIPT, calendarAt } from './timeline';

// No music: the office. Its hush; the mail landing and Rorit's click; the group chat (her messages whoosh out, the
// others' pop in); Yashinozarus's keys; the calendar's pages flying while Eter waits; Lulu's steps; and a sparkle
// on the year 20666.

type Kind = 'mail' | 'click' | 'buzz' | 'pop' | 'sent' | 'key' | 'flip' | 'step' | 'sparkle';

/** Lulu's steps (seconds apart), and the fastest the calendar's pages are heard turning (seconds apart). */
const LULU_STEP = 0.5;
const FLIP_GAP = 0.18;
/** How finely the calendar is checked for a new page (seconds). */
const FLIP_SCAN = 0.02;

/** Whether t is at `where` (keys are only heard in the room you're in). */
const shownAt = (t: number, where: (typeof CUTS)[number][1]) => CUTS.findLast(([at]) => at <= t)?.[1] === where;

/** Each time the calendar shows a new page while she waits, no closer together than FLIP_GAP. */
function flips(): number[] {
  const out: number[] = [];
  let shown = calendarAt(CUE.wait[0]);
  for (let t = CUE.wait[0]; t < CUE.wait[1]; t += FLIP_SCAN) {
    const now = calendarAt(t);
    if (now === shown) continue;
    shown = now;
    if (out.length === 0 || t - out.at(-1)! >= FLIP_GAP) out.push(t);
  }
  return out;
}

function cues(): Cue<Kind>[] {
  return [
    { at: CUE.mail, kind: 'mail' },
    { at: CUE.open, kind: 'click' },
    { at: CUE.phoneOut, kind: 'buzz' },
    ...CHAT.map(m => ({ at: m.at, kind: m.from === 'Rorit' ? ('sent' as const) : ('pop' as const) })),
    ...keystrokes(YASHI_SCRIPT)
      .filter(t => shownAt(t, 'yashi'))
      .map(at => ({ at, kind: 'key' as const })),
    ...flips().map(at => ({ at, kind: 'flip' as const })),
    ...every(CUE.lulu[0], CUE.lulu[1], LULU_STEP).map(at => ({ at, kind: 'step' as const })),
    { at: CUE.year, kind: 'sparkle' },
  ];
}

const PLAYERS: Record<Kind, Player> = {
  mail: (b, w) => ding(b, w, 1046.5),
  click: fx.tick,
  buzz: fx.vibrate,
  pop: chatPop,
  sent: chatSent,
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
