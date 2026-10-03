import { drumHits } from '../../audio/drum-patterns';
import { midi } from '../../audio/notes';
import { guitar, bass, drums, BPM, DURATION, POSE } from './music';
import { CAPTIONS } from './captions';

const eighth = 60 / BPM / 2;

describe('Meet Rory', () => {
  it('the riff and the drums fill the episode and end on the pose', () => {
    const last = Math.max(...guitar.notes.map(([at]) => at * eighth));
    expect(last).toBeCloseTo(POSE, 5);
    expect(Math.max(...drumHits(drums).map(h => h.time))).toBeCloseTo(POSE, 5);
    expect(POSE).toBeLessThan(DURATION);
  });

  it('every note is playable and the bass sits an octave under the guitar', () => {
    for (const [, note] of [...guitar.notes, ...bass.notes]) expect(() => midi(note)).not.toThrow();
    const [first] = bass.notes;
    const match = guitar.notes.find(([at]) => at === first![0])!;
    expect(midi(match[1]) - midi(first![1])).toBe(12);
  });

  it('captions start with a capital letter and stay inside the episode', () => {
    for (const c of CAPTIONS) {
      expect(c.text).not.toMatch(/^\p{Ll}/u);
      expect(c.to).toBeLessThanOrEqual(DURATION);
    }
  });
});
