import { drumHits } from '../../audio/drum-patterns';
import { bassTimes } from '../../audio/bass';
import { CAPTIONS } from './captions';
import { AT, EIGHTH, END_OF_SONG, bass, drums, guitar, vocal } from './music';
import { DURATION, LINES } from './timeline';

/** YouTube Shorts can run up to three minutes (seconds). */
const SHORTS_MAX_S = 180;
/** Sixteenths to an eighth: the drums' grid against everyone else's. */
const PER_EIGHTH = 2;

describe('Prog Night in 7/8', () => {
  it('is a Short, ending on the ringing D and three lines', () => {
    expect(DURATION).toBeLessThanOrEqual(SHORTS_MAX_S);
    expect(LINES[0]!.from).toBeGreaterThan(END_OF_SONG);
  });

  it('every drum track runs the whole song, to the last D', () => {
    for (const pattern of Object.values(drums.tracks)) expect(pattern.length).toBe((AT.end + 8) * PER_EIGHTH);
    const last = Math.max(...drumHits(drums).map(h => h.time));
    expect(last).toBeCloseTo(AT.end * EIGHTH);
  });

  it('the drums come in after the bass, on the toms', () => {
    const first = drumHits(drums)[0]!;
    expect(first.time).toBeCloseTo(AT.drumsIn * EIGHTH);
    expect(Math.min(...bassTimes(bass))).toBe(0);
  });

  it('the guitar and the vocal come in where the song says', () => {
    expect(Math.min(...guitar.notes.map(([at]) => at))).toBe(AT.groove);
    expect(Math.min(...vocal.notes.map(([at]) => at))).toBe(AT.verse);
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
});
