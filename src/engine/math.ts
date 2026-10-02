// Small animation helpers. Every episode is a pure function of time t (seconds),
// so these are all you need to choreograph a scene.

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** 0..1 progress of t through the window [a, b]. */
export const seg = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));

/** easeInOutQuad */
export const ease = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Deterministic random (mulberry32), so scenes look identical on every render. */
export function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
