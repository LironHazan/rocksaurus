import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { dashAt } from './screens';
import {
  CUE,
  CUTS,
  DURATION,
  FROK,
  LINES,
  SYLLABLES,
  TICKETS_MAX,
  TICKET_TICKS,
  mouthAt,
  redAt,
  speakerAt,
  ticketsAt,
  whereAt,
} from './timeline';

describe('Frok Goes Wild', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the story happens in order', () => {
    const order = [
      CUE.install,
      CUE.perms[0],
      CUE.dial,
      CUE.answer,
      CUE.sidewalk[0],
      CUE.waiting,
      CUE.amaz[0],
      CUE.red[0],
      CUE.wild[0],
      CUE.onIt,
      CUE.flood[0],
      CUE.swamped[0],
      CUE.cube[0],
      CUE.arrive,
      CUE.laugh[0],
      CUE.give,
      CUE.sip,
      CUE.tag[0],
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.tag[1]).toBe(DURATION);
  });

  it('cuts to whoever is talking: Rorit in the car, Lulu and Amazarus at the office', () => {
    for (const l of LINES) {
      const mid = (l.from + l.to) / 2;
      expect(whereAt(mid)).toBe(l.who === 'Rorit' ? 'car' : 'office');
    }
    for (const f of FROK) expect(whereAt((f.from + f.to) / 2)).toBe('car');
    CUTS.forEach(([t], i) => i > 0 && expect(t).toBeGreaterThan(CUTS[i - 1]![0]));
  });

  it('one person talks at a time, with time to read each line', () => {
    LINES.forEach((l, i) => {
      expect(l.to - l.from).toBeGreaterThanOrEqual(1.4);
      if (i > 0) expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
    });
    expect(speakerAt(CUE.laugh[0] + 0.5)).toBeNull(); // Lulu's laughing, not talking
  });

  it('mouths move only on their own syllables', () => {
    for (const s of SYLLABLES) expect(mouthAt(s.who, s.at + s.dur / 2)).toBeGreaterThan(0.3);
    expect(mouthAt('Amazarus', CUE.drive[0] + 1)).toBe(0);
  });

  it('Frok’s tickets double up to 4,096, one tick per doubling', () => {
    expect(ticketsAt(CUE.flood[0] - 0.1)).toBe(0);
    expect(ticketsAt(CUE.flood[0])).toBe(2);
    expect(ticketsAt(CUE.flood[1])).toBe(TICKETS_MAX);
    expect(TICKET_TICKS).toHaveLength(Math.log2(TICKETS_MAX));
  });

  it('Amazarus goes red on the call, tomato at the flood, and the tea cools him down', () => {
    expect(redAt(CUE.amaz[0])).toBe(0);
    expect(redAt(CUE.amaz[1])).toBeGreaterThan(0.6);
    expect(redAt(CUE.swamped[1])).toBe(1);
    expect(redAt(CUE.tag[0])).toBe(0);
  });

  it('the dash shows the call, Frok and the tickets at the right moments', () => {
    expect(dashAt(0).kind).toBe('map');
    expect(dashAt(CUE.perms[1]).kind).toBe('install');
    expect(dashAt(LINES[0]!.from)).toMatchObject({ kind: 'call', who: 'Lulu' });
    expect(dashAt(CUE.waiting + 0.5)).toMatchObject({ kind: 'ringing', who: 'Amazarus' });
    expect(dashAt(CUE.flood[0] + 1).kind).toBe('tickets');
    expect(dashAt(CUE.tag[0] + 1).kind).toBe('frok');
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
    // two captions on the same line never overlap
    for (const a of CAPTIONS)
      for (const b of CAPTIONS)
        if (a !== b && a.y === b.y) expect(a.to <= b.from + 1e-9 || b.to <= a.from + 1e-9).toBe(true);
  });

  it('the beds cover the whole video', () => {
    for (let t = 0; t < DURATION; t += 0.5) expect(SOUND.beds.some(b => t >= b.from && t < b.to)).toBe(true);
  });
});
