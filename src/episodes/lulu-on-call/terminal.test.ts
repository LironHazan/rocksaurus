import { keystrokes, linesAt, OFFICE_SCRIPT, NIGHT_SCRIPT, type ScriptLine } from './terminal';
import { CUE, DURATION, SCENES, STORY_END, sceneAt } from './timeline';

const script: ScriptLine[] = [
  { at: 0, text: '$', kind: 'title' },
  { at: 1, text: 'hello', kind: 'prompt', cps: 10 },
];

describe('terminal script', () => {
  it('types lines out character by character', () => {
    expect(linesAt(script, 0.5)).toEqual([{ text: '$', kind: 'title' }]);
    expect(linesAt(script, 1.25)[1]).toEqual({ text: 'he', kind: 'prompt' });
    expect(linesAt(script, 9)[1]?.text).toBe('hello');
  });

  it('has a keystroke for every typed character', () => {
    expect(keystrokes(script)).toEqual([1, 1.1, 1.2, 1.3, 1.4]);
  });

  it('finishes typing before the story moves on', () => {
    const typedBy = (s: readonly ScriptLine[]) => Math.max(...keystrokes(s));
    expect(typedBy(OFFICE_SCRIPT)).toBeLessThan(CUE.airDrum);
    expect(typedBy(NIGHT_SCRIPT)).toBeLessThan(67.2);
  });
});

describe('timeline', () => {
  it('scenes are back to back and fill the episode (1 to 2 minutes)', () => {
    SCENES.forEach((s, i) => expect(s.from).toBe(i === 0 ? 0 : SCENES[i - 1]!.to));
    expect(SCENES.at(-1)!.to).toBe(STORY_END);
    expect(DURATION).toBeGreaterThanOrEqual(60);
    expect(DURATION).toBeLessThanOrEqual(120);
  });

  it('finds the scene for a time', () => {
    expect(sceneAt(CUE.page).id).toBe('night');
    expect(sceneAt(CUE.drink).id).toBe('gains');
  });
});
