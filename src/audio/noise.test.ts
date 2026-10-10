import { noiseStart, whiteNoise } from './noise';

describe('whiteNoise', () => {
  it('is the Park–Miller sequence every noise buffer was built from', () => {
    // the formula each buffer used inline before it was shared: seed ← seed · 16807 mod (2³¹ − 1)
    let seed = 11;
    const inline = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    };
    const shared = whiteNoise(11);
    for (let i = 0; i < 1000; i++) expect(shared()).toBe(inline());
  });

  it('stays in [-1, 1)', () => {
    const next = whiteNoise(7);
    for (let i = 0; i < 1000; i++) {
      const x = next();
      expect(x).toBeGreaterThanOrEqual(-1);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('noiseStart', () => {
  it('scatters the start point and keeps it inside the window', () => {
    expect(noiseStart(2, 7.3, 1.5)).toBe((2 * 7.3) % 1.5);
    for (const when of [0, 0.37, 12.5, 61.2]) {
      expect(noiseStart(when, 7.3, 1.5)).toBeGreaterThanOrEqual(0);
      expect(noiseStart(when, 7.3, 1.5)).toBeLessThan(1.5);
    }
  });
});
