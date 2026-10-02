import { mouthOpenAt, sungNotes } from './vowels';

describe('vocal timing', () => {
  const notes = sungNotes({
    bpm: 120,
    notes: [
      [0, 'E4', 2, 'a'],
      [4, 'G4', 1, 'u'],
    ],
  });

  it('converts eighths to seconds and defaults the vowel to "a"', () => {
    expect(sungNotes({ bpm: 120, notes: [[2, 'B4', 1]] })).toEqual([{ start: 0.5, end: 0.75, vowel: 'a', note: 'B4' }]);
    expect(notes[1]).toMatchObject({ start: 1, end: 1.25, vowel: 'u' });
  });

  it('opens the mouth per vowel and closes it between notes', () => {
    expect(mouthOpenAt(notes, 0.3)).toBe(1); // mid "aah"
    expect(mouthOpenAt(notes, 0.8)).toBe(0); // silence
    expect(mouthOpenAt(notes, 1.1)).toBeCloseTo(0.45); // "ooh" is narrower
  });

  it('eases in at the start of a note', () => {
    expect(mouthOpenAt(notes, 0.025)).toBeCloseTo(0.5);
  });
});
