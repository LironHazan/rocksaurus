import { drumHits } from '../../audio/drum-patterns';
import { bendAt, playedNotes } from '../../audio/blues-guitar';
import { CAPTIONS } from './captions';
import { SOUND } from './sound';
import { BAR, BEAT, CHORUS_BARS, FINAL_CHORD, INTRO_BARS, LULU_IN, UNIT, drums, guitar } from './music';
import { CUE, DURATION, LINES } from './timeline';

/** Triplet eighths to a bar of 12/8. */
const STEPS = 12;
/** How far a time is from the nearest triplet eighth (in triplet eighths). */
const offGrid = (t: number) => Math.abs(t / UNIT - Math.round(t / UNIT));

describe('Slow Blues in A', () => {
  it('is a Short: under a minute, ending on the ringing chord and two lines', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
    expect(FINAL_CHORD).toBeCloseTo((INTRO_BARS + CHORUS_BARS) * BAR);
    expect(LINES[0]!.from).toBeGreaterThan(FINAL_CHORD);
  });

  it('every drum track is whole bars of 12/8, the intro silent but for the pickup', () => {
    for (const pattern of Object.values(drums.tracks)) expect(pattern.length % STEPS).toBe(0);
    const first = drumHits(drums)[0]!;
    expect(first.time).toBeCloseTo(LULU_IN); // her first hit is the pickup…
    expect(first.time).toBeGreaterThan((INTRO_BARS - 1) * BAR + 2 * BEAT); // …on the last beat of the intro
  });

  it('the drum steps fall on the triplet grid', () => {
    for (const hit of drumHits(drums)) expect(offGrid(hit.time)).toBeCloseTo(0, 6);
  });

  it('every guitar note lands on the grid and ends before the last chord', () => {
    for (const n of playedNotes(guitar)) {
      expect(offGrid(n.start)).toBeCloseTo(0, 6);
      expect(n.end).toBeLessThanOrEqual(FINAL_CHORD + 1e-9);
    }
  });

  it('a bend rises to its target and holds; a release lets down to the fretted note', () => {
    const notes = playedNotes(guitar);
    const bent = notes.find(n => n.touch.bend === 2)!;
    expect(bendAt(bent, bent.start)).toBe(0);
    expect(bendAt(bent, bent.end - 0.01)).toBeCloseTo(2);
    const released = notes.find(n => n.touch.release)!;
    expect(bendAt(released, released.start)).toBeCloseTo(released.touch.release!);
    expect(bendAt(released, released.end)).toBeCloseTo(0);
  });

  it('Lulu sits before she plays, after she walks in', () => {
    expect(CUE.sneak[0]).toBeLessThan(CUE.sit);
    expect(CUE.sit).toBeLessThan(CUE.in);
    expect(CUE.noticed).toBeGreaterThan(CUE.final);
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
