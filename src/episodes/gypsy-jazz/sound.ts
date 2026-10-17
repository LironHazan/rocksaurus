import { cueSheet } from '../../audio/cue-sheet';
import { DURATION } from './timeline';

// The music is the soundtrack (index.ts plays it, and their three lines). Around it, only the room's hush.

export const SOUND = cueSheet({
  duration: DURATION,
  players: {},
  cues: [],
  beds: [{ from: 0, to: DURATION, kind: 'room' }],
});
