import type { Episode, Stage } from './types';

// no Web Audio in tests: the player only needs the audio clock when sound is on
vi.mock('../audio/context', () => ({ audio: { ctx: { currentTime: 0, resume: vi.fn() }, master: {} } }));
vi.mock('../audio/schedule', () => ({ cancelScheduled: vi.fn() }));
vi.mock('./captions', () => ({ drawCaptions: vi.fn() }));

import { createPlayer } from './player';

let nowMs = 0;
let frames: FrameRequestCallback[] = [];

function setup() {
  const update = vi.fn();
  const episode: Episode = { id: 'ep', title: 'Ep', duration: 10, setup: () => ({ update }) };
  const render = vi.fn();
  const canvas = {} as HTMLCanvasElement;
  const stage = { format: {}, render, canvas } as unknown as Stage;
  const player = createPlayer(stage, episode);
  /** Runs one animation frame. */
  const tick = () => frames.splice(0).forEach(cb => cb(nowMs));
  return { player, update, render, canvas, tick };
}

beforeEach(() => {
  nowMs = 0;
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
});
afterEach(() => vi.restoreAllMocks());

describe('player pause', () => {
  it('freezes on the current frame and lets the clock stand still', () => {
    const { player, tick } = setup();
    nowMs = 3000;
    player.pause();
    nowMs = 8000;
    tick();
    expect(player.time()).toBeCloseTo(3, 5);
    expect(player.getSnapshot()).toMatchObject({ paused: true, time: 3 });
  });

  it('moves the frozen frame when seeking, and keeps it frozen', () => {
    const { player, update, tick } = setup();
    player.pause();
    player.seek(6.5);
    nowMs = 5000;
    tick();
    expect(player.time()).toBeCloseTo(6.5, 5);
    expect(update).toHaveBeenLastCalledWith(6.5);
  });

  it('resumes from where it was frozen', () => {
    const { player } = setup();
    nowMs = 2000;
    player.pause();
    nowMs = 9000;
    player.resume();
    nowMs = 10_000;
    expect(player.time()).toBeCloseTo(3, 5);
    expect(player.getSnapshot().paused).toBe(false);
  });

  it('restart lets go of a frozen frame', () => {
    const { player } = setup();
    nowMs = 4000;
    player.pause();
    player.restart();
    expect(player.getSnapshot().paused).toBe(false);
  });
});

describe('player renderAt', () => {
  it('renders any time, with or without captions, without moving the clock', () => {
    const { player, update, render, canvas } = setup();
    nowMs = 1000;
    expect(player.renderAt(7, false)).toBe(canvas);
    expect(update).toHaveBeenLastCalledWith(7);
    expect(render).toHaveBeenLastCalledWith(undefined);
    player.renderAt(7, true);
    expect(render).toHaveBeenLastCalledWith(expect.any(Function));
    expect(player.time()).toBeCloseTo(1, 5);
  });

  it('clamps to the episode', () => {
    const { player, update } = setup();
    player.renderAt(99, false);
    expect(update).toHaveBeenLastCalledWith(10);
  });
});
