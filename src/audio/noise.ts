/**
 * The Park–Miller "minimal standard" generator: seed ← seed · 16807 mod (2³¹ − 1). Every noise buffer (foley, sfx,
 * breath, slap clicks, the piano's hammer knock) uses it, each from its own seed, so every render sounds the same.
 */
const MULTIPLIER = 16807;
const MODULUS = 2 ** 31 - 1;

/** White noise from `seed`: each call gives the next sample, in [-1, 1). */
export function whiteNoise(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * MULTIPLIER) % MODULUS;
    return (s / MODULUS) * 2 - 1;
  };
}

/**
 * Where a sound at `when` starts reading a noise buffer (seconds into it): somewhere different each time (it jumps
 * `scatter` seconds per second of song), so the same hit twice never sounds machine-identical; always within the
 * first `window` seconds, which leaves room in the buffer for the sound itself.
 */
export const noiseStart = (when: number, scatter: number, window: number): number => (when * scatter) % window;
