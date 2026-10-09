import { timedNotes } from './keyboard-part';

describe('timedNotes', () => {
  it('converts eighths to seconds and note names to MIDI, sorted by start', () => {
    const notes = timedNotes({
      bpm: 120,
      notes: [
        [2, 'E4', 1],
        [0, 'C3', 4, 0.5, 'L'],
      ],
    });
    expect(notes).toEqual([
      { midi: 48, start: 0, end: 1, hand: 'L' },
      { midi: 64, start: 0.5, end: 0.75, hand: 'R' },
    ]);
  });

  it('supports 16th notes as half eighths', () => {
    const [n] = timedNotes({ bpm: 120, notes: [[0.5, 'A4', 0.5]] });
    expect(n).toMatchObject({ start: 0.125, end: 0.25 });
  });
});
