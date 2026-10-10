import { drumHits } from '../../audio/drum-patterns';
import { CAPTIONS } from './captions';
import { BASS, DRUMS, GUITAR } from './music';
import { BAR, CUE, CUP_LANDINGS, DURATION, LINES } from './timeline';

const eighth = BAR / 8;

describe('The Last Yogurt', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
    expect(CUE.ride[1] - CUE.ride[0]).toBeCloseTo(2 * BAR); // the car song is two whole bars
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

  it('the music only plays in Omli’s car: Lulu’s scenes are natural sound', () => {
    const times = [...BASS.notes.map(n => n[0] * eighth), ...drumHits(DRUMS).map(h => h.time)].map(
      t => CUE.ride[0] + t,
    );
    expect(Math.min(...times)).toBeCloseTo(CUE.ride[0]);
    expect(Math.max(...times)).toBeLessThan(CUE.ride[1]);
  });

  it('the guitar only plays in Omli’s car', () => {
    const times = GUITAR.notes.map(n => CUE.ride[0] + n[0] * eighth);
    expect(Math.min(...times)).toBeCloseTo(CUE.ride[0]);
    expect(Math.max(...times)).toBeLessThan(CUE.ride[1]);
  });

  it('the judged yogurt’s bloops are while she looks, one per hop', () => {
    expect(CUP_LANDINGS.length).toBeGreaterThan(CUE.cups.length);
    for (const at of CUP_LANDINGS) {
      expect(at).toBeGreaterThanOrEqual(CUE.cups[0]);
      expect(at).toBeLessThan(CUE.sigh);
    }
  });
});
