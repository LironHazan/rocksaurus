import { CAPTIONS } from './captions';
import { CHAT, CUE, DURATION, LINES, MEMBERS, SYLLABLES, mouthAt, speakerAt } from './timeline';
import { BEDS, EFFECTS } from './sound';
import { TYPING } from '../../props/phone';

// the sound is plain data; stub out everything that would open an AudioContext
vi.mock('../../audio/foley', () => ({
  vibrate: vi.fn(),
  keyTap: vi.fn(),
  stomp: vi.fn(),
  rustle: vi.fn(),
  sparkle: vi.fn(),
  bird: vi.fn(),
  tear: vi.fn(),
  munch: vi.fn(),
  gulp: vi.fn(),
  gasp: vi.fn(),
  bed: vi.fn(),
}));
vi.mock('../../audio/sfx', () => ({ boop: vi.fn() }));
vi.mock('../../audio/voice', () => ({ sing: vi.fn() }));
vi.mock('../../audio/schedule', () => ({ atTime: vi.fn() }));

describe('Office Besties', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the story happens in order', () => {
    const order = [
      CUE.buzz,
      CUE.chat[0],
      CUE.reaction[0],
      CUE.stash[0],
      CUE.grab,
      CUE.raise,
      CUE.arrive[0],
      CUE.establish,
      CUE.handoff[0],
      CUE.give,
      CUE.tear,
      CUE.chomp[0],
      CUE.chomp[1],
      CUE.gossip[0],
      CUE.gasp,
      CUE.end[0],
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.end[1]).toBe(DURATION);
  });

  it('the whole chat happens on Lulu’s phone, with time to read each message', () => {
    CHAT.forEach((m, i) => {
      expect(MEMBERS).toContain(m.from);
      expect(m.at - TYPING).toBeGreaterThanOrEqual(CUE.chat[0] - TYPING);
      expect(m.at).toBeLessThan(CUE.chat[1]);
      if (i > 0) expect(m.at - CHAT[i - 1]!.at).toBeGreaterThanOrEqual(1.6);
    });
    expect(CHAT.at(-1)!.from).toBe('Lulu'); // she's on it
  });

  it('one person talks at a time, on the bench', () => {
    LINES.forEach((l, i) => {
      expect(l.from).toBeGreaterThanOrEqual(CUE.gossip[0]);
      expect(l.to).toBeLessThanOrEqual(DURATION);
      if (i > 0) expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
    });
    expect(speakerAt(LINES[0]!.from + 0.5)).toBe(LINES[0]!.who);
    expect(speakerAt(CUE.gasp + 0.5)).toBeNull(); // everyone's too shocked to talk
  });

  it('mouths move only on their own syllables, inside their lines', () => {
    for (const s of SYLLABLES) {
      const line = LINES.find(l => s.at >= l.from && s.at + s.dur <= l.to);
      expect(line?.who).toBe(s.who);
      expect(mouthAt(s.who, s.at + s.dur / 2)).toBeGreaterThan(0.3);
    }
    expect(mouthAt('Lulu', CUE.chat[0])).toBe(0);
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
  });

  it('sound effects are sorted, the beds cover the whole video', () => {
    EFFECTS.forEach((fx, i) => {
      expect(fx.at).toBeGreaterThanOrEqual(0);
      expect(fx.at).toBeLessThanOrEqual(DURATION);
      if (i > 0) expect(fx.at).toBeGreaterThanOrEqual(EFFECTS[i - 1]!.at);
    });
    for (let t = 0; t < DURATION; t += 0.5) expect(BEDS.some(b => t >= b.from && t < b.to)).toBe(true);
  });
});
