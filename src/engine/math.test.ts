import { clamp01, ease, lerp, rng, seg } from './math';

describe('math helpers', () => {
  it('seg maps t into 0..1 within a window and clamps outside it', () => {
    expect(seg(5, 4, 6)).toBe(0.5);
    expect(seg(1, 4, 6)).toBe(0);
    expect(seg(9, 4, 6)).toBe(1);
  });

  it('ease is symmetric and hits its endpoints', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(0.25) + ease(0.75)).toBeCloseTo(1);
  });

  it('lerp and clamp01 behave', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it('rng is deterministic per seed and stays in [0, 1)', () => {
    const a = rng(42),
      b = rng(42),
      c = rng(7);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(Array.from({ length: 5 }, c)).not.toEqual(seqA);
    for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
  });
});
