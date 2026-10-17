import { drumHits } from '../../audio/drum-patterns';
import { playedNotes } from '../../audio/lead-guitar';
import { bassTimes } from '../../audio/bass';
import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { BAR, FINAL_CHORD, OUT, UNIT, bass, drums, guitar } from './music';
import { DURATION, LINES } from './timeline';

/** YouTube Shorts can run up to three minutes (seconds). */
const SHORTS_MAX_S = 180;
/** Triplet eighths to a bar of 4/4 swing. */
const STEPS = 12;
/** The tremolo is picked twice a triplet eighth. */
const TREMOLO = 2;
/** How far a time is from the nearest point on a grid of `per` steps a triplet eighth (in those steps). */
const offGrid = (t: number, per = 1) => Math.abs((t / UNIT) * per - Math.round((t / UNIT) * per));

describe('Gypsy Jazz in G', () => {
  it('is a Short, ending on the ringing chord and the lines', () => {
    expect(DURATION).toBeLessThanOrEqual(SHORTS_MAX_S);
    expect(FINAL_CHORD).toBeGreaterThan(OUT * BAR);
    expect(LINES[0]!.from).toBeGreaterThan(FINAL_CHORD);
  });

  it('every drum track is whole bars on the triplet grid, starting with the count-in', () => {
    for (const pattern of Object.values(drums.tracks)) expect(pattern.length % STEPS).toBe(0);
    const hits = drumHits(drums);
    expect(hits[0]!.name).toBe('click');
    for (const hit of hits) expect(offGrid(hit.time)).toBeCloseTo(0, 6);
    expect(Math.max(...hits.map(h => h.time))).toBeCloseTo(FINAL_CHORD);
  });

  it('every guitar note lands on the grid (the tremolo on its half) and ends before the last chord', () => {
    for (const n of playedNotes(guitar)) {
      expect(offGrid(n.start, TREMOLO)).toBeCloseTo(0, 6);
      expect(n.end).toBeLessThanOrEqual(FINAL_CHORD + 1e-9);
    }
  });

  it('la pompe plays a chord on every beat until the ending', () => {
    const beats = new Set(guitar.chords.map(([at]) => at));
    for (let at = STEPS; at < OUT * STEPS; at += STEPS / 4) expect(beats.has(at)).toBe(true);
  });

  it('the bass is on the grid and lands with the last chord', () => {
    const times = bassTimes(bass);
    for (const t of times) expect(offGrid(t)).toBeCloseTo(0, 6);
    expect(Math.max(...times)).toBeCloseTo(FINAL_CHORD);
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

  it('the room is heard the whole way through', () => {
    for (let t = 0; t < DURATION; t += 0.5) expect(SOUND.beds.some(b => t >= b.from && t < b.to)).toBe(true);
  });
});
