import { formatTime } from './time';

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [5.9, '0:05'],
    [65.4, '1:05'],
    [-3, '0:00'],
  ])('%d s → %s', (s, expected) => expect(formatTime(s)).toBe(expected));
});
