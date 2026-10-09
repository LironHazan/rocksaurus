import { CAPTIONS } from './captions';
import {
  CAST,
  CUE,
  DURATION,
  FIX_SCRIPT,
  LAPTOP_SCRIPT,
  LINES,
  SYLLABLES,
  clockAt,
  mouthAt,
  speakerAt,
} from './timeline';
import { EFFECTS } from './sound';
import { DESK, FIDGET } from './sets';

describe('Invalid Date', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the night happens in order', () => {
    const order = [
      CUE.bedroom[0],
      CUE.alert,
      CUE.sitUp,
      CUE.laptop[0],
      CUE.callRorit[0],
      CUE.roritAnswers,
      CUE.taluzarus,
      CUE.amazaurus,
      CUE.warRoom[0],
      CUE.fixed,
      CUE.timelapse[0],
      CUE.eilon,
      CUE.ask,
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.morning[1]).toBe(DURATION);
  });

  it('the terminals show the expired certs, then the fix, in time', () => {
    expect(LAPTOP_SCRIPT.some(l => l.text.includes('Invalid Date'))).toBe(true);
    for (const l of LAPTOP_SCRIPT.slice(1)) {
      expect(l.at).toBeGreaterThanOrEqual(CUE.laptop[0]);
      expect(l.at).toBeLessThan(CUE.laptop[1]);
    }
    expect(FIX_SCRIPT.at(-1)!.at).toBe(CUE.fixed);
  });

  it('one person talks at a time, and only the cast', () => {
    LINES.forEach((l, i) => {
      expect(CAST).toContain(l.who);
      expect(l.to).toBeLessThanOrEqual(DURATION);
      if (i > 0) expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
    });
    expect(speakerAt(CUE.ask + 0.5)).toBe('Eilon');
    for (const s of SYLLABLES) expect(mouthAt(s.who, s.at + s.dur / 2)).toBeGreaterThan(0.3);
  });

  it('the clock: 3:21 in the war room, 5:40 by the time-lapse, nearly 9 when Eilon arrives', () => {
    expect(clockAt(CUE.warRoom[0])).toEqual([3, 21]);
    expect(clockAt(CUE.timelapse[0])).toEqual([5, 40]);
    expect(clockAt(CUE.ask)).toEqual([8, 58]);
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
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

  it('Taluzarus fidgets all over his spot, but never through the desk', () => {
    const body = 0.55 * 1.15; // his body's half-width, tall as he is
    expect(FIDGET.x - FIDGET.rx - body).toBeGreaterThanOrEqual(DESK.x + DESK.width / 2);
  });
});
