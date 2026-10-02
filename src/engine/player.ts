import { audio } from '../audio/context';
import { cancelScheduled } from '../audio/schedule';
import { drawCaptions } from './captions';
import type { Episode, Stage } from './types';

/** Seconds of silence / reverb ring after the timeline before looping. */
const TAIL = 1;
/** How often subscribers are told about time changes (ms) — keeps React re-renders cheap. */
const NOTIFY_EVERY = 100;

export interface PlayerSnapshot {
  readonly time: number;
  readonly soundOn: boolean;
}

export interface Player {
  restart(): void;
  setSound(on: boolean): Promise<void>;
  /** Jump to time t (seconds). Seeking turns sound off; music always plays from the start. */
  seek(t: number): void;
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
  let snapshot: PlayerSnapshot = { time: 0, soundOn: false };
  const listeners = new Set<() => void>();

  const notify = (time: number, force = false) => {
    const now = performance.now();
    if (!force && now - lastNotify < NOTIFY_EVERY) return;
    lastNotify = now;
    snapshot = { time, soundOn };
    for (const l of listeners) l();
  };

  function stopBus() {
    cancelScheduled();
    if (!bus) return;
    const old = bus;
    old.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
    setTimeout(() => old.disconnect(), 500);
    bus = null;
  }

  function restart() {
    stopBus();
    start = performance.now();
    if (soundOn) {
      t0 = audio.ctx.currentTime + 0.05;
      bus = audio.ctx.createGain();
      bus.connect(audio.master);
      episode.audio?.(bus, t0);
    }
  }

  const elapsed = () => (soundOn ? audio.ctx.currentTime - t0 : (performance.now() - start) / 1000);

  function frame() {
    let t = elapsed();
    if (t >= episode.duration + TAIL) {
      const cbs = loopEndCallbacks;
      loopEndCallbacks = [];
      cbs.forEach(cb => cb());
      restart();
      t = elapsed();
    }
    t = Math.min(Math.max(t, 0), episode.duration);
    scene.update(t);
    stage.render(ctx => drawCaptions(ctx, episode.captions ?? [], t, stage.format));
    notify(t);
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return {
    restart,
    async setSound(on) {
      if (on) await Promise.all([audio.ctx.resume(), episode.preload?.()]);
      soundOn = on;
      restart();
      notify(0, true);
    },
    seek(t) {
      if (soundOn) {
        soundOn = false;
        restart();
      }
      start = performance.now() - t * 1000;
      notify(t, true);
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
