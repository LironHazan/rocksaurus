import { TYPING } from '../../props/phone';
import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { CHAT, COMPLIANT_YEAR, CUE, CUTS, DURATION, LINES, YASHI_SCRIPT, calendarAt } from './timeline';

describe('Narnia Compliance', () => {
  it('the story runs in order: the email, the gasp, the chat, Yashinozarus, the plan, the grind, Lulu, the year', () => {
    const order = [
      CUE.mail,
      CUE.open,
      CUE.gasp,
      CUE.phoneOut,
      CUE.chat[0],
      CUE.yashi[0],
      CUE.board[0],
      CUE.grind[0],
      CUE.lulu[0],
      CUE.year,
    ];
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    expect(CUE.year).toBeLessThan(DURATION);
  });

  it('the whole chat happens while the phones are out, each message typed before it lands', () => {
    for (const m of CHAT) {
      expect(m.at - TYPING).toBeGreaterThanOrEqual(CUE.phoneOut);
      expect(m.at).toBeLessThan(CUE.chat[1]);
    }
    for (let i = 1; i < CHAT.length; i++) expect(CHAT[i]!.at - CHAT[i - 1]!.at).toBeGreaterThanOrEqual(TYPING);
    expect(CHAT[0]!.from).toBe('Rorit'); // she raises the alarm
  });

  it('nobody talks over anybody, and Lulu has the last word', () => {
    for (let i = 1; i < LINES.length; i++) expect(LINES[i]!.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
    expect(LINES.at(-1)!.who).toBe('Lulu');
    expect(LINES.at(-1)!.text).toContain(String(COMPLIANT_YEAR));
  });

  it('the approval is the quick part: the name is approved before the grind starts', () => {
    const approved = YASHI_SCRIPT.find(l => l.text.includes('approved'))!;
    expect(approved.at).toBeLessThan(CUE.grind[0]);
    expect(CHAT.some(m => m.text.includes('200'))).toBe(true); // 200 microservices, 200 certs
  });

  it('the calendar says day 1 until the grind, flies through the days and years, and ends on 20666', () => {
    expect(calendarAt(0)).toBe('Day 1');
    expect(calendarAt(CUE.grind[0])).toBe('Day 1');
    const seen: number[] = [];
    for (let t = CUE.grind[0]; t <= CUE.grind[1]; t += 0.1) {
      const [unit, n] = calendarAt(t).split(' ');
      seen.push(unit === 'Year' ? Number(n) * 365 : Number(n));
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]!).toBeGreaterThanOrEqual(seen[i - 1]!);
    expect(calendarAt(CUE.lulu[0])).toMatch(/^Year \d+$/);
    expect(calendarAt(CUE.year)).toContain(String(COMPLIANT_YEAR));
  });

  it('cuts are in order, and his screen only changes while we are at his desk', () => {
    for (let i = 1; i < CUTS.length; i++) expect(CUTS[i]![0]).toBeGreaterThan(CUTS[i - 1]![0]);
    const atHisDesk = (t: number) => CUTS.findLast(([at]) => at <= t)?.[1] === 'yashi';
    for (const l of YASHI_SCRIPT.slice(1)) expect(atHisDesk(l.at)).toBe(true);
    expect(atHisDesk(LINES.find(l => l.who === 'Yashinozarus')!.from)).toBe(true);
  });

  it('captions are capitalised, inside the video, and never overlap on a line', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}\d]+/u, '')[0]!;
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
