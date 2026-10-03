import { keystrokes, linesAt, type ScriptLine } from './screen-script';

const script: ScriptLine[] = [
  { at: 0, text: '$', kind: 'title' },
  { at: 1, text: 'hello', kind: 'prompt', cps: 10 },
];

describe('screen script', () => {
  it('types lines out character by character', () => {
    expect(linesAt(script, 0.5)).toEqual([{ text: '$', kind: 'title' }]);
    expect(linesAt(script, 1.25)[1]).toEqual({ text: 'he', kind: 'prompt' });
    expect(linesAt(script, 9)[1]?.text).toBe('hello');
  });

  it('has a keystroke for every typed character', () => {
    expect(keystrokes(script)).toEqual([1, 1.1, 1.2, 1.3, 1.4]);
  });
});
