import { CAPTIONS } from './captions';
import { BAR, BARS, CHAT, CUE, DURATION, LINES, MEMBERS, MUSIC_AT, SYLLABLES, mouthAt } from './timeline';
import { BASS, DRUMS, GUITAR, luluPlays, omliPlays, roryPlays } from './music';
import { EFFECTS } from './sound';
import { drumHits } from '../../audio/drum-patterns';
import { TYPING } from '../../props/phone';

vi.mock('../../audio/foley', () => ({
  cheer: vi.fn(),
  vibrate: vi.fn(),
  keyTap: vi.fn(),
  stomp: vi.fn(),
  bed: vi.fn(),
}));
vi.mock('../../audio/sfx', () => ({ boop: vi.fn() }));
vi.mock('../../audio/voice', () => ({ sing: vi.fn() }));
vi.mock('../../audio/bass', () => ({ playBass: vi.fn() }));
vi.mock('../../audio/drums', () => ({ playDrums: vi.fn() }));
vi.mock('../../audio/guitar', () => ({ playRiff: vi.fn() }));
vi.mock('../../audio/schedule', () => ({ atTime: vi.fn() }));

const eighth = 60 / BASS.bpm / 2;

describe('The Audition', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the story happens in order, and the song fits the audition', () => {
    const order = [
      CUE.buzz,
      CUE.pickUp,
      CUE.pov,
      CUE.flex,
      CUE.enter,
      CUE.solo,
      CUE.drumsIn,
      CUE.guitarIn,
      CUE.lastHit,
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.lastHit + 1).toBeLessThan(CUE.verdict[0]);
  });

  it('Omli plays alone, then Lulu joins, then Rory', () => {
    const firstDrum = Math.min(...drumHits(DRUMS).map(h => h.time));
    const firstGuitar = Math.min(...GUITAR.notes.map(n => n[0] * eighth));
    expect(Math.min(...BASS.notes.map(n => n[0] * eighth))).toBe(0);
    expect(firstDrum).toBeCloseTo(BARS.drumsIn * BAR);
    expect(firstGuitar).toBeCloseTo(BARS.guitarIn * BAR);
    expect(omliPlays(0.1)).toBe('play');
    expect(luluPlays(0.1)).toBe('idle');
    expect(roryPlays(BARS.drumsIn * BAR + 0.1)).toBe('idle');
    expect(roryPlays(BARS.guitarIn * BAR + 0.1)).toBe('play');
  });

  it('everyone stops on the same last hit', () => {
    const last = BARS.lastHit * BAR;
    expect(Math.max(...BASS.notes.map(n => n[0] * eighth))).toBeCloseTo(last);
    expect(Math.max(...GUITAR.notes.map(n => n[0] * eighth))).toBeCloseTo(last);
    expect(Math.max(...drumHits(DRUMS).map(h => h.time))).toBeCloseTo(last);
    expect(MUSIC_AT + last).toBeCloseTo(CUE.lastHit);
  });

  it('Lulu’s DM lands while we’re on Omli’s phone, with time to read each message', () => {
    CHAT.forEach((m, i) => {
      expect(MEMBERS).toContain(m.from);
      expect(m.at).toBeGreaterThanOrEqual(CUE.pov);
      expect(m.at).toBeLessThan(CUE.flex);
      if (i > 0) expect(m.at - CHAT[i - 1]!.at).toBeGreaterThanOrEqual(1.6);
    });
  });

  it('Omli types his answer on screen, not during the grin', () => {
    for (const m of CHAT.filter(c => c.from === 'Omli')) expect(m.at - TYPING).toBeGreaterThanOrEqual(CUE.grin[1]);
  });

  it('one person talks at a time; mouths move on their syllables', () => {
    LINES.forEach((l, i) => i > 0 && expect(l.from).toBeGreaterThanOrEqual(LINES[i - 1]!.to));
    for (const s of SYLLABLES) expect(mouthAt(s.who, s.at + s.dur / 2)).toBeGreaterThan(0.3);
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
});
