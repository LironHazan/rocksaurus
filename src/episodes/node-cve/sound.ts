import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { chatPop, ding } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { keystrokes } from '../../world/screen-script';
import { LULU_SCRIPT, YASHI_SCRIPT } from './terminal';
import { ASKERS, CUE, CUTS, DURATION } from './timeline';

// No music: the office. Its hush, their keys, the askers' steps, his message landing (twice: it's critical), her
// reply landing on his screen, and her head on the desk.

type Kind = 'key' | 'step' | 'alert' | 'reply' | 'thud';

/** The askers' steps (seconds apart). */
const STEP = 0.42;

/** Whether t is in a scene at `where` (keys only sound in the room you're in). */
const shownAt = (t: number, where: (typeof CUTS)[number][1]) => CUTS.findLast(([at]) => at <= t)?.[1] === where;

function cues(): Cue<Kind>[] {
  const keys = [
    ...keystrokes(LULU_SCRIPT).filter(t => shownAt(t, 'lulu')),
    ...keystrokes(YASHI_SCRIPT).filter(t => shownAt(t, 'yashi')),
  ];
  return [
    ...keys.map(at => ({ at, kind: 'key' as const })),
    ...ASKERS.flatMap(a => [...every(a.walk[0], a.walk[1], STEP), ...every(a.leave[0], a.leave[1], STEP)])
      .filter(at => at < DURATION)
      .map(at => ({ at, kind: 'step' as const })),
    { at: CUE.ping, kind: 'alert' },
    { at: CUE.ping + 0.5, kind: 'alert' },
    { at: CUE.reply[0] + 0.3, kind: 'reply' },
    { at: CUE.facePlant + 0.5, kind: 'thud' },
  ];
}

const PLAYERS: Record<Kind, Player> = {
  key: (b, w) => fx.keyTap(quieter(b, 0.5), w),
  step: (b, w) => fx.footstep(quieter(b, 0.6), w),
  alert: (b, w) => ding(b, w, 1568),
  reply: chatPop,
  thud: (b, w) => fx.stomp(quieter(b, 0.7), w),
};

/** The office's sound; index.ts plays it with their voices. */
export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [{ from: 0, to: DURATION, kind: 'room' }],
});
