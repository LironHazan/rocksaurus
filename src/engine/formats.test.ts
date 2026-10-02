import { DEFAULT_FORMAT, FORMATS, isFormatId } from './formats';

describe('formats', () => {
  it('are YouTube-ready sizes', () => {
    expect(FORMATS.shorts).toMatchObject({ width: 1080, height: 1920 });
    expect(FORMATS.landscape).toMatchObject({ width: 1920, height: 1080 });
  });
  it('keep caption safe zones inside the frame', () => {
    for (const f of Object.values(FORMATS)) {
      expect(f.safe.top).toBeGreaterThan(0);
      expect(f.safe.bottom).toBeLessThan(1);
      expect(f.safe.top).toBeLessThan(f.safe.bottom);
    }
  });
  it('validates ids from the URL', () => {
    expect(isFormatId('shorts')).toBe(true);
    expect(isFormatId('square')).toBe(false);
    expect(isFormatId(null)).toBe(false);
    expect(isFormatId(DEFAULT_FORMAT)).toBe(true);
  });
});
