import { audio } from './context';

/** How far ahead of a note its audio nodes are built (seconds). Covers background-tab timer throttling (~1 s). */
const LOOKAHEAD = 1.5;

let generation = 0;

/**
 * Builds a note's audio nodes just before it plays, instead of all at once up front. Building a whole song's
 * nodes at the start overloads the browser's audio thread (every connected node is processed, even notes that
 * won't sound for 20 seconds), so dense songs would play slowly or not at all.
 */
export function atTime(when: number, make: () => void): void {
  const delay = (when - audio.ctx.currentTime - LOOKAHEAD) * 1000;
  if (delay <= 0) {
    make();
    return;
  }
  const gen = generation;
  setTimeout(() => {
    if (gen === generation) make(); // skip notes from a pass that was stopped or restarted
  }, delay);
}

/** Drops every note that hasn't been built yet (call when playback stops or restarts). */
export function cancelScheduled(): void {
  generation++;
}
