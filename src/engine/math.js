// Small animation helpers. Every episode is a pure function of time t (seconds),
// so these are all you need to choreograph a scene.

export const clamp01 = x => Math.min(1, Math.max(0, x));

/** 0..1 progress of t through the window [a, b]. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a));

/** easeInOutQuad */
export const ease = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export const lerp = (a, b, k) => a + (b - a) * k;

/** Deterministic random (mulberry32), so scenes look identical on every render. */
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
