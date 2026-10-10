import { fpsOf } from './frameStats';

describe('fpsOf', () => {
  it('counts the frames between the first and the last timestamp', () => {
    // 61 frames, 1000/60 ms apart: one second at 60 fps
    const frames = Array.from({ length: 61 }, (_, i) => (i * 1000) / 60);
    expect(fpsOf(frames)).toBeCloseTo(60);
  });

  it('is 0 until there are two frames to measure between', () => {
    expect(fpsOf([])).toBe(0);
    expect(fpsOf([16])).toBe(0);
    expect(fpsOf([16, 16])).toBe(0);
  });
});
