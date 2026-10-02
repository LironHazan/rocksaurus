import { beatPulse, eighthsToSeconds, latestStarted, recentHit } from './timing';

describe('band timing', () => {
  it('beatPulse peaks on the beat and decays', () => {
    expect(beatPulse(0, 0.5)).toBe(1);
    expect(beatPulse(0.25, 0.5)).toBeCloseTo(0.125);
  });

  it('recentHit is 0 before the first hit and 1 right on a hit', () => {
    expect(recentHit(0.5, [1, 2])).toBe(0);
    expect(recentHit(1, [1, 2])).toBe(1);
    expect(recentHit(1.1, [1, 2], 10)).toBeCloseTo(Math.exp(-1));
  });

  it('latestStarted finds the current item', () => {
    const items = [{ start: 0 }, { start: 1 }, { start: 2 }];
    expect(latestStarted(items, 1.5)).toBe(items[1]);
    expect(latestStarted(items, -1)).toBeNull();
  });

  it('eighthsToSeconds converts and sorts', () => {
    expect(eighthsToSeconds(120, [2, 0])).toEqual([0, 0.5]);
  });
});
