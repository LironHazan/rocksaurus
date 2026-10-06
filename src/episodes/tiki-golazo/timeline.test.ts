import { CAPTIONS } from './captions';
import { BAR, CUE, DURATION, PASSES, ballAt, netPush, touches } from './timeline';
import { GOAL } from './sets/pitch';
import { BARS, DRUMS, EFFECTS, PLAN } from './music';
import { drumHits } from '../../audio/drum-patterns';

// the score is plain data; stub out everything that would open an AudioContext
vi.mock('../../audio/foley', () => ({
  whistle: vi.fn(),
  kickBall: vi.fn(),
  swish: vi.fn(),
  cheer: vi.fn(),
  stomp: vi.fn(),
}));
vi.mock('../../audio/sfx', () => ({ boop: vi.fn() }));
vi.mock('../../audio/keyboard-part', () => ({ playKeyboardPart: vi.fn() }));
vi.mock('../../audio/drums', () => ({ playDrums: vi.fn() }));
vi.mock('../../audio/voice', () => ({ playVocal: vi.fn() }));
vi.mock('../../audio/schedule', () => ({ atTime: vi.fn() }));
vi.mock('../../world/text-texture', () => ({ textTexture: vi.fn() }));

describe('Tiki Taka scores a golazo', () => {
  it('is a Short: under a minute, a whole number of bars', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
    expect(BARS * BAR).toBe(DURATION);
    expect(PLAN).toHaveLength(BARS);
  });

  it('the drop lands on the goal: a bar line, with a crash', () => {
    expect(Number.isInteger(CUE.goal / BAR)).toBe(true);
    const crashes = drumHits(DRUMS)
      .filter(h => h.name === 'crash')
      .map(h => h.time);
    expect(crashes).toContainEqual(CUE.goal);
  });

  it('the chord loop starts again on the goal, so the anthem starts on its first phrase', () => {
    expect(PLAN[CUE.goal / BAR]).toBe('Em');
  });

  it('the story happens in order', () => {
    const order = [
      CUE.arrive[1],
      CUE.shirt[0],
      CUE.whistle,
      PASSES[0]![0],
      CUE.dribble[0],
      CUE.stepover[0],
      CUE.shot,
      CUE.goal,
      CUE.score,
      CUE.jump[0],
      CUE.siuu[0],
      CUE.bump,
      CUE.kids[0],
      CUE.final,
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThanOrEqual(order[i - 1]!));
    expect(CUE.final).toBeLessThan(DURATION);
  });

  it('each pass arrives before the next one is kicked', () => {
    PASSES.forEach(([kick, arrive], i) => {
      expect(arrive).toBeGreaterThan(kick);
      if (i > 0) expect(kick).toBeGreaterThan(PASSES[i - 1]![1]);
    });
    expect(PASSES.at(-1)![1]).toBeLessThanOrEqual(CUE.dribble[0]);
  });

  it('the ball ends up in the net, and stays there', () => {
    expect(ballAt(CUE.goal - 0.5)[0]).toBeLessThan(GOAL.x);
    for (const t of [CUE.goal, CUE.goal + 1, DURATION]) {
      const [x, y, z] = ballAt(t);
      expect(x).toBeGreaterThanOrEqual(GOAL.x);
      expect(y).toBeGreaterThan(0);
      expect(Math.abs(z)).toBeLessThan(GOAL.width / 2);
    }
    expect(netPush(CUE.goal - 0.1)).toBe(0);
    expect(netPush(CUE.goal + 0.1)).toBeGreaterThan(0.5);
  });

  it('the ball never jumps between frames', () => {
    for (let t = 0; t < DURATION; t += 1 / 30) {
      const a = ballAt(t),
        b = ballAt(t + 1 / 30);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), `at ${t.toFixed(2)} s`).toBeLessThan(0.75);
    }
  });

  it('every touch is during play', () => {
    for (const t of touches()) {
      expect(t).toBeGreaterThan(CUE.whistle);
      expect(t).toBeLessThanOrEqual(CUE.shot);
    }
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
  });

  it('sound effects are sorted and inside the video', () => {
    EFFECTS.forEach((fx, i) => {
      expect(fx.at).toBeGreaterThanOrEqual(0);
      expect(fx.at).toBeLessThanOrEqual(DURATION);
      if (i > 0) expect(fx.at).toBeGreaterThanOrEqual(EFFECTS[i - 1]!.at);
    });
  });
});
