import { audio } from '../audio/context';
import { cancelScheduled } from '../audio/schedule';
import { drawCaptions } from './captions';
import type { Episode, Stage } from './types';

/** Seconds of silence / reverb ring after the timeline before looping. */
const TAIL = 1;
/** How often subscribers are told about time changes (ms) — keeps React re-renders cheap. */
const NOTIFY_EVERY = 100;
/** Seconds for the old bus to fade out on stop (no click), and ms before it's disconnected, well after. */
const FADE_OUT = 0.05;
const DISCONNECT_AFTER_MS = 500;
/** Seconds of headroom before the first note, so it isn't scheduled in the past. */
const START_LEAD = 0.05;

export interface PlayerSnapshot {
  readonly time: number;
  readonly soundOn: boolean;
  readonly paused: boolean;
}

export interface Player {
  restart(): void;
  setSound(on: boolean): Promise<void>;
  /** Jump to time t (seconds). Seeking turns sound off; music always plays from the start. */
  seek(t: number): void;
  /** Freezes the picture on the current frame (and turns sound off); `seek` still moves the frozen frame. */
  pause(): void;
  resume(): void;
  /** The exact current time in seconds (the snapshot's `time` is only updated ~10×/s). */
  time(): number;
  /**
   * Renders the picture at time t (without disturbing playback, since an episode is a pure function of time)
   * and returns the stage canvas. Copy it right away: the next frame draws over it.
   */
  renderAt(t: number, captions: boolean): HTMLCanvasElement;
  /** Runs once when the current pass (timeline + tail) finishes. */
  onceLoopEnd(cb: () => void): void;
  /** useSyncExternalStore-compatible subscription. */
  subscribe(listener: () => void): () => void;
  getSnapshot(): PlayerSnapshot;
  dispose(): void;
}

/**
 * Plays an episode in a loop on a stage. When sound is on, the visuals follow the audio clock,
 * so picture and music never drift apart.
 */
export function createPlayer(stage: Stage, episode: Episode): Player {
  const scene = episode.setup(stage);
  let start = performance.now();
  let t0 = 0;
  let bus: GainNode | null = null;
  let soundOn = false;
  let loopEndCallbacks: Array<() => void> = [];
  let frameId = 0;
  let lastNotify = 0;
  let held: number | null = null; // the frozen time while paused
  let snapshot: PlayerSnapshot = { time: 0, soundOn: false, paused: false };
  const listeners = new Set<() => void>();

  const notify = (time: number, force = false) => {
    const now = performance.now();
    if (!force && now - lastNotify < NOTIFY_EVERY) return;
    lastNotify = now;
    snapshot = { time, soundOn, paused: held !== null };
    for (const l of listeners) l();
  };

  function stopBus() {
    cancelScheduled();
    if (!bus) return;
    const old = bus;
    old.gain.setTargetAtTime(0, audio.ctx.currentTime, FADE_OUT);
    setTimeout(() => old.disconnect(), DISCONNECT_AFTER_MS);
    bus = null;
  }

  function restartClock() {
    stopBus();
    start = performance.now();
    if (soundOn) {
      t0 = audio.ctx.currentTime + START_LEAD;
      bus = audio.ctx.createGain();
      bus.connect(audio.master);
      episode.audio?.(bus, t0);
    }
  }

  const elapsed = () => (soundOn ? audio.ctx.currentTime - t0 : (performance.now() - start) / 1000);
  const clamp = (t: number) => Math.min(Math.max(t, 0), episode.duration);
  const now = () => held ?? clamp(elapsed());
  const drawCaptionsAt = (t: number) => (ctx: CanvasRenderingContext2D) =>
    drawCaptions(ctx, episode.captions ?? [], t, stage.format);

  function frame() {
    let t = held ?? elapsed();
    if (held === null && t >= episode.duration + TAIL) {
      const cbs = loopEndCallbacks;
      loopEndCallbacks = [];
      cbs.forEach(cb => cb());
      restartClock();
      t = elapsed();
    }
    t = clamp(t);
    scene.update(t);
    stage.render(drawCaptionsAt(t));
    notify(t);
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return {
    restart() {
      held = null;
      restartClock();
      notify(0, true);
    },
    async setSound(on) {
      if (on) await Promise.all([audio.ctx.resume(), episode.preload?.()]);
      held = null; // music plays from the top, so any frozen frame is let go
      soundOn = on;
      restartClock();
      notify(0, true);
    },
    seek(t) {
      if (soundOn) {
        soundOn = false;
        restartClock();
      }
      if (held !== null) held = clamp(t);
      else start = performance.now() - t * 1000;
      notify(t, true);
    },
    pause() {
      if (held !== null) return;
      const t = now();
      if (soundOn) {
        soundOn = false;
        restartClock();
      }
      held = t;
      notify(t, true);
    },
    resume() {
      if (held === null) return;
      start = performance.now() - held * 1000;
      held = null;
      notify(now(), true);
    },
    time: now,
    renderAt(t, captions) {
      const at = clamp(t);
      scene.update(at);
      stage.render(captions ? drawCaptionsAt(at) : undefined);
      return stage.canvas;
    },
    onceLoopEnd(cb) {
      loopEndCallbacks.push(cb);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    dispose() {
      cancelAnimationFrame(frameId);
      stopBus();
      listeners.clear();
      scene.dispose?.();
    },
  };
}
