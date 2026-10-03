import { keystrokes, type ScriptLine } from '../../world/screen-script';
import { OFFICE_SCRIPT, NIGHT_SCRIPT } from './terminal';
import { CUE, DURATION, SCENES, STORY_END, sceneAt } from './timeline';

describe("Lulu's screens", () => {
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
