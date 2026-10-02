import { drums, guitar, bass, piano, organ, vocal, DURATION, T } from './music';
import { midi } from '../../audio/notes';

const steps = (pattern: string) => pattern.replace(/\s/g, '').length;
const EIGHTH = 0.25;

describe('Rocksaurus Live arrangement', () => {
  it('every drum track spans the whole song (mixed 7/8 and 4/4 bars stay in sync)', () => {
    for (const [name, pattern] of Object.entries(drums.tracks)) {
      expect({ name, seconds: steps(pattern!) * (EIGHTH / 2) }).toEqual({ name, seconds: DURATION });
    }
  });

  it('sections are in order', () => {
    const order = [T.countIn, T.intro, T.verse, T.brk, T.chorus, T.ending, T.end];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('no part plays past the end, and every note name is valid', () => {
    const parts = [guitar.notes, bass.notes, piano.notes, organ.notes, vocal.notes];
    for (const notes of parts) {
      for (const [at, note] of notes) {
        expect(at * EIGHTH).toBeLessThan(DURATION);
        expect(() => midi(note)).not.toThrow();
      }
    }
  });
});
