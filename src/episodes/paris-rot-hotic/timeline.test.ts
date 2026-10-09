import { CAPTIONS } from './captions';
import { BAR, CUE, DURATION, TRY, TRY_AT, TRY_LEN, fitting } from './timeline';
import { EFFECTS, PLAN } from './music';

describe('Paris at Rot Hotic', () => {
  it('is a Short: under a minute, and a whole number of waltz bars', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
    expect(DURATION / BAR).toBe(PLAN.length);
  });

  it('cues are in story order', () => {
    const order = [
      CUE.bell,
      CUE.walkIn[1],
      CUE.pick,
      TRY_AT[0],
      TRY_AT[2] + TRY_LEN,
      CUE.counter,
      CUE.notice,
      CUE.take[1],
      CUE.total,
      CUE.bag,
      CUE.poof,
      CUE.throw,
      CUE.land,
      CUE.nat20,
    ];
    order.forEach((t, i) => expect(t).toBeGreaterThanOrEqual(i === 0 ? 0 : order[i - 1]!));
    expect(CUE.nat20).toBeLessThan(DURATION);
  });

  it('each fitting ends before the next starts', () => {
    TRY_AT.forEach((s, i) => {
      expect(s + TRY.open[1]).toBeLessThanOrEqual(s + TRY_LEN);
      if (i > 0) expect(s).toBeGreaterThanOrEqual(TRY_AT[i - 1]! + TRY_LEN);
    });
    expect(fitting(0).look).toBe('goth');
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      expect(c.text[0]).toBe(c.text[0]!.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
  });

  it('sound effects are sorted and inside the video', () => {
    EFFECTS.forEach((fx, i) => {
      expect(fx.at).toBeGreaterThanOrEqual(0);
      expect(fx.at).toBeLessThanOrEqual(DURATION);
      if (i > 0) expect(fx.at).toBeGreaterThanOrEqual(EFFECTS[i - 1]!.at);
    });
  });
});
