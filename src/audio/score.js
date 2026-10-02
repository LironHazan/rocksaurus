import { piano } from './piano.js';

/**
 * Plays a written score on the piano.
 *   melody:  [beat, note, lengthInBeats]
 *   harmony: { at, bass, chord, hits = [1, 2], hold = 0.8 }
 *            bass is struck on `at`; the chord on each beat offset in `hits`, held `hold` beats.
 *   extras:  [beat, note, lengthInBeats, velocity]  (sparkles, fills)
 * Returns the beat length in seconds, so callers can line SFX up with the music.
 */
export function playScore(bus, t0, { bpm, melody = [], harmony = [], extras = [] }) {
  const beat = 60 / bpm;
  for (const [b, note, len] of melody) piano(bus, t0 + b * beat, note, 0.55, len * beat);
  for (const { at, bass, chord, hits = [1, 2], hold = 0.8 } of harmony) {
    piano(bus, t0 + at * beat, bass, 0.4, 3 * beat);
    for (const h of hits)
      chord.forEach((note, i) => piano(bus, t0 + (at + h) * beat + i * 0.012, note, 0.2, hold * beat)); // tiny roll
  }
  for (const [b, note, len, vel = 0.25] of extras) piano(bus, t0 + b * beat, note, vel, len * beat);
  return beat;
}
