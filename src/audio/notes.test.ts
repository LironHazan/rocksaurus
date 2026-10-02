import { frequency, midi } from './notes';

describe('note names', () => {
  it.each([
    ['C4', 60],
    ['A4', 69],
    ['E1', 28],
    ['F#3', 54],
    ['Bb4', 70],
  ])('%s → MIDI %i', (name, expected) => {
    expect(midi(name)).toBe(expected);
  });

  it('passes numbers through', () => expect(midi(64)).toBe(64));
  it('rejects bad names', () => expect(() => midi('H2')).toThrow(/Bad note name/));
  it('A4 is 440 Hz and octaves double', () => {
    expect(frequency('A4')).toBeCloseTo(440);
    expect(frequency('A5')).toBeCloseTo(880);
  });
});
