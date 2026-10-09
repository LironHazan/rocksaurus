import { drumHits } from '../../audio/drum-patterns';
import { CAPTIONS } from './captions';
import { BASS, DRUMS, GUITAR } from './music';
import { BAR, BARS, CUE, DURATION, LINES } from './timeline';

const eighth = BAR / 8;

describe('The Last Yogurt', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
    expect(BARS.end * BAR).toBe(DURATION);
  });

  it('the story happens in order', () => {
    const order = [
      CUE.enter[1],
      CUE.open,
      ...CUE.cups,
      CUE.sigh,
      CUE.mirta[0],
      CUE.take,
      CUE.point,
      CUE.lid,
      ...CUE.bites,
      CUE.yuck[0],
      CUE.toss,
      CUE.ride[0],
      ...CUE.sips,
      CUE.asleep,
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
  });

  it('nobody talks over anybody, and every caption is inside the Short', () => {
    LINES.forEach((l, i) => i > 0 && expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to));
    for (const c of CAPTIONS) {
      expect(c.from).toBeLessThan(c.to);
      expect(c.to).toBeLessThanOrEqual(DURATION);
    }
  });

  it('the bass walks in alone, then the drums; the band stops for the yuck and the drums sit out the bed', () => {
    const hits = drumHits(DRUMS).map(h => h.time);
    expect(Math.min(...BASS.notes.map(n => n[0] * eighth))).toBe(0);
    expect(Math.min(...hits)).toBeCloseTo(BARS.drumsIn * BAR);
    const inside = (from: number, to: number) => hits.filter(t => t > from + 0.01 && t < to);
    expect(inside(CUE.yuck[0], CUE.yuck[1])).toEqual([]);
    expect(hits.filter(t => t >= CUE.bed[0])).toEqual([]);
  });

  it('the guitar only plays in Omli’s car', () => {
    const times = GUITAR.notes.map(n => n[0] * eighth);
    expect(Math.min(...times)).toBeCloseTo(CUE.ride[0]);
    expect(Math.max(...times)).toBeLessThan(CUE.ride[1]);
  });
});
