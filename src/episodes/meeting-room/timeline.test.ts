import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { CHANNELS, CUE, DURATION, LINES, SYLLABLES, mouthAt, postsAt, speakerAt } from './timeline';

describe('Everything Reached Prod?', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the story happens in order', () => {
    const order = [CUE.room, ...CUE.posts, CUE.tagged[0], CUE.bug, CUE.floor[0], CUE.door, CUE.inside, CUE.confused[0]];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.confused[1]).toBe(DURATION);
  });

  it('he posts in five channels, one at a time', () => {
    expect(CUE.posts).toHaveLength(CHANNELS.length);
    expect(postsAt(CUE.posts[0] - 0.1)).toBe(0);
    expect(postsAt(CUE.tagged[0])).toBe(CHANNELS.length);
  });

  it('one dino talks at a time, with time to read each line', () => {
    LINES.forEach((l, i) => {
      expect(l.to - l.from).toBeGreaterThanOrEqual(1.5);
      if (i > 0) expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to);
    });
    expect(speakerAt(CUE.confused[0] + 1)).toBeNull(); // Lulu has nothing to say
  });

  it('mouths move only on their own syllables', () => {
    for (const s of SYLLABLES) expect(mouthAt(s.who, s.at + s.dur / 2)).toBeGreaterThan(0.3);
    expect(mouthAt('Lulu', CUE.confused[0] + 1)).toBe(0);
  });

  it('captions are capitalised, stay inside the video and never overlap on a line', () => {
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

  it('the beds cover the whole video', () => {
    for (let t = 0; t < DURATION; t += 0.5) expect(SOUND.beds.some(b => t >= b.from && t < b.to)).toBe(true);
  });
});
