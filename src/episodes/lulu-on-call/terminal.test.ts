import { keystrokes, type ScriptLine } from '../../world/screen-script';
import { OFFICE_SCRIPT, NIGHT_SCRIPT } from './terminal';
import { CAPTIONS } from './captions';
import {
  CUE,
  DURATION,
  PACE,
  SCENES,
  SKIPPED,
  STORY_END,
  WALK_END,
  playedCaptions,
  playedTime,
  sceneAt,
  scriptTime,
} from './timeline';
import { STEPS } from './music';

// the score is plain data; stub out everything that would open an AudioContext
vi.mock('../../audio/drums', () => ({
  playDrums: vi.fn(),
  snare: vi.fn(),
  tom: vi.fn(),
  crash: vi.fn(),
  kick: vi.fn(),
}));
vi.mock('../../audio/foley', () => ({}));
vi.mock('../../audio/schedule', () => ({ atTime: vi.fn() }));

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

  it('the video length is the script minus the skipped end of the walk', () => {
    expect(DURATION).toBeCloseTo((STORY_END - SKIPPED) * PACE, 10);
    expect(SKIPPED).toBeGreaterThan(0);
  });

  it('finds the scene for a time', () => {
    expect(sceneAt(CUE.page).id).toBe('night');
    expect(sceneAt(CUE.drink).id).toBe('gains');
  });
});

describe('the shortened walk', () => {
  it('plays the walk up to WALK_END, then jumps straight to the next scene', () => {
    const gains = SCENES.find(s => s.id === 'gains')!;
    expect(scriptTime(WALK_END - 0.01)).toBeCloseTo(WALK_END - 0.01, 10);
    expect(scriptTime(WALK_END)).toBeCloseTo(WALK_END, 10);
    expect(scriptTime(WALK_END + 0.001)).toBeCloseTo(gains.from + 0.001, 10);
    expect(sceneAt(scriptTime(WALK_END + 0.001)).id).toBe('gains');
  });

  it('played and script times convert back and forth', () => {
    for (const played of [0, 5, 16.3, WALK_END - 0.5, WALK_END + 0.2, 40, 70 - SKIPPED]) {
      expect(playedTime(scriptTime(played))).toBeCloseTo(played, 10);
    }
  });

  it('everything the walk does fits in the part that plays', () => {
    expect(CUE.walkStart).toBeLessThan(CUE.walkStop);
    expect(CUE.walkStop).toBeLessThan(WALK_END);
    expect(CUE.walkShots[2]).toBeLessThanOrEqual(CUE.walkStop);
    expect([...CUE.walkShots]).toEqual([...CUE.walkShots].sort((a, b) => a - b));
    for (const s of STEPS) expect(s).toBeLessThan(WALK_END);
    expect(STEPS.length).toBeGreaterThan(8);
  });

  it('no caption is lost to the skipped stretch, and none is stretched or squashed', () => {
    const played = playedCaptions(CAPTIONS);
    expect(played).toHaveLength(CAPTIONS.length);
    played.forEach((c, i) => {
      const original = CAPTIONS[i]!;
      expect(c.to - c.from).toBeCloseTo(original.to - original.from, 10);
    });
  });

  it('captions after the walk move up by exactly what was skipped', () => {
    const [before] = CAPTIONS.filter(c => c.text.includes('GAINS'));
    const [after] = playedCaptions(CAPTIONS).filter(c => c.text.includes('GAINS'));
    expect(after!.from).toBeCloseTo(before!.from - SKIPPED, 10);
  });
});
