import { pianoSamples } from './piano-model';

const SR = 8000;
const rms = (a: Float32Array, from: number, to: number) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i]! * a[i]!;
  return Math.sqrt(s / (to - from));
};

describe('pianoSamples', () => {
  it('is normalized and starts from silence', () => {
    const a = pianoSamples(60, SR, 1);
    expect(Math.max(...a.map(Math.abs))).toBeCloseTo(1, 5);
    expect(Math.abs(a[0]!)).toBeLessThan(0.01);
  });

  it('rings out: louder at the strike than a second later', () => {
    const a = pianoSamples(64, SR, 1.5);
    expect(rms(a, 0, 800)).toBeGreaterThan(rms(a, SR, SR + 800) * 3);
  });

  it('is deterministic', () => {
    expect(pianoSamples(67, SR, 0.2)).toEqual(pianoSamples(67, SR, 0.2));
  });
});
