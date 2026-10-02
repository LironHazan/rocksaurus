/** 1 on each beat, decaying to 0 before the next (power controls how snappy). */
export const beatPulse = (t: number, beat: number, power = 3): number => Math.pow(1 - ((t / beat) % 1), power);

/** 1 right at the most recent time ≤ t, decaying quickly; 0 before the first. `times` must be sorted. */
export function recentHit(t: number, times: readonly number[], rate = 16): number {
  let last = -Infinity;
  for (const h of times) {
    if (h <= t) last = h;
    else break;
  }
  return Math.exp(-(t - last) * rate);
}

/** The latest item whose start ≤ t (items sorted by start), or null. */
export function latestStarted<T extends { start: number }>(items: readonly T[], t: number): T | null {
  let found: T | null = null;
  for (const it of items) {
    if (it.start <= t) found = it;
    else break;
  }
  return found;
}

/** Seconds of each item in an eighth-note part: [eighth, ...] → eighth × (60 / bpm / 2). */
export const eighthsToSeconds = (bpm: number, eighths: readonly number[]): number[] =>
  eighths.map(e => (e * 60) / bpm / 2).sort((a, b) => a - b);
