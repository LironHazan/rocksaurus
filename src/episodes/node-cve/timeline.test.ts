import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { LULU_SCRIPT, YASHI_SCRIPT } from './terminal';
import { ASKERS, CUE, CUTS, DURATION, LINES } from './timeline';

describe('Another Day, Another Node.js CVE', () => {
  it('each asker asks after walking up, and is answered before walking off', () => {
    for (const a of ASKERS) {
      const theirs = LINES.filter(l => l.who === a.who && l.from >= a.walk[1] && l.to <= a.leave[0]);
      expect(theirs.length).toBeGreaterThan(0);
    }
  });

  it('nobody talks over anybody', () => {
    for (let i = 1; i < LINES.length; i++) expect(LINES[i]!.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
  });

  it('the story runs in order: the sign, focus, the CVE, his DM, the walk over, the patch, back, the face plant', () => {
    const order = [
      CUE.sign,
      CUE.focus[0],
      CUE.yashi[0],
      CUE.dm,
      CUE.ping,
      CUE.walkOver[0],
      CUE.patch[0],
      CUE.back,
      CUE.facePlant,
    ];
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    expect(CUE.facePlant).toBeLessThan(DURATION);
  });

  it('cuts are in order, and his screen only changes while we are at his desk', () => {
    for (let i = 1; i < CUTS.length; i++) expect(CUTS[i]![0]).toBeGreaterThan(CUTS[i - 1]![0]);
    const atHisDesk = (t: number) => CUTS.findLast(([at]) => at <= t)?.[1] === 'yashi';
    for (const l of YASHI_SCRIPT.slice(1)) expect(atHisDesk(l.at)).toBe(true);
    expect(LULU_SCRIPT.every(l => l.at < DURATION)).toBe(true);
  });

  it('captions are capitalised, inside the video, and never overlap on a line', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
    for (const a of CAPTIONS)
      for (const b of CAPTIONS)
        if (a !== b && a.y === b.y) expect(a.to <= b.from + 1e-9 || b.to <= a.from + 1e-9).toBe(true);
  });

  it('the office is heard the whole way through', () => {
    for (let t = 0; t < DURATION; t += 0.5) expect(SOUND.beds.some(b => t >= b.from && t < b.to)).toBe(true);
  });
});
