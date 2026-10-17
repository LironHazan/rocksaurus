import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { playSyllables } from '../../audio/babble';
import * as fx from '../../audio/foley';
import { CUE, DURATION, SYLLABLES } from './timeline';

// The music is the soundtrack (index.ts plays it). Around it, only the room: its hush, Lulu's soft steps as she
// tiptoes in, the throne as she sits, and the two of them talking at the end.

type Kind = 'tiptoe' | 'throne';

/** Her tiptoe steps (seconds apart). */
const TIPTOE_STEP = 0.55;

function cues(): Cue<Kind>[] {
  return [
    ...every(CUE.sneak[0], CUE.sneak[1], TIPTOE_STEP).map(at => ({ at, kind: 'tiptoe' as const })),
    { at: CUE.sit, kind: 'throne' },
  ];
}

const PLAYERS: Record<Kind, Player> = {
  tiptoe: (b, w) => fx.stomp(quieter(b, 0.18), w),
  throne: (b, w) => fx.rustle(quieter(b, 0.5), w),
};

export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [{ from: 0, to: DURATION, kind: 'room' }],
});

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  playSyllables(bus, t0, SYLLABLES);
}
