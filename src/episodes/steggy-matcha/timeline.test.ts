import { keystrokes } from '../../world/screen-script';
import { CUE, DURATION, SCENES, STORY_END, sceneAt } from './timeline';
import { ROOM_DOC } from './documents';
import { CAPTIONS } from './captions';
import { GROOVE } from './music';

describe('Steggy & the Matcha Theory', () => {
  it('scenes are back to back and the video is about a minute', () => {
    SCENES.forEach((s, i) => expect(s.from).toBe(i === 0 ? 0 : SCENES[i - 1]!.to));
    expect(SCENES.at(-1)!.to).toBe(STORY_END);
    expect(DURATION).toBeGreaterThanOrEqual(55);
    expect(DURATION).toBeLessThanOrEqual(65);
  });

  it('the nudges and the café happen in their scenes', () => {
    for (const n of CUE.nudges) expect(sceneAt(n).id).toBe('sister');
    expect(sceneAt(CUE.serve[0]).id).toBe('cafe');
  });

  it('he finishes typing before the story moves on', () => {
    expect(Math.max(...keystrokes(ROOM_DOC))).toBeLessThan(SCENES[1]!.from);
  });

  it('every caption starts with a capital letter (or an emoji/number)', () => {
    for (const c of CAPTIONS) expect(c.text).not.toMatch(/^\p{Ll}/u);
  });

  it('the slap-bass groove runs the whole story, in order', () => {
    const times = GROOVE.bass.map(b => b.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(Math.max(...GROOVE.bass.map(b => b.at + b.len))).toBeGreaterThan(STORY_END - 3);
    expect(GROOVE.stabs.length).toBeGreaterThan(10);
    expect(GROOVE.pops.length).toBeGreaterThan(5);
  });
});
