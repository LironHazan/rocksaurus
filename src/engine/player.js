import { audio } from '../audio/context.js';
import { drawCaptions } from './captions.js';

const TAIL = 1; // seconds of silence/reverb ring after the timeline before looping

/**
 * Plays an episode in a loop. When sound is on, the visuals follow the audio clock,
 * so picture and music never drift apart.
 */
export function createPlayer(stage, episode, { onTime } = {}) {
  const scene = episode.setup(stage);
  let start = performance.now(), t0 = 0, bus = null, soundOn = false;
  let loopEndCallbacks = [];

  function restart() {
    if (bus) {
      const old = bus;
      old.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
      setTimeout(() => old.disconnect(), 500);
      bus = null;
    }
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
      const cbs = loopEndCallbacks; loopEndCallbacks = [];
      cbs.forEach(cb => cb());
      restart();
      t = elapsed();
    }
    t = Math.min(Math.max(t, 0), episode.duration);
    scene.update(t);
    stage.render(ctx => drawCaptions(ctx, episode.captions ?? [], t, stage.format));
    onTime?.(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    restart,
    get soundOn() { return soundOn; },
    async setSound(on) {
      if (on) await Promise.all([audio.ctx.resume(), episode.preload?.()]); // e.g. load recorded tracks
      soundOn = on;
      restart();
    },
    /** Jump to time t (seconds). Seeking turns sound off; music always plays from the start. */
    seek(t) {
      if (soundOn) { soundOn = false; restart(); }
      start = performance.now() - t * 1000;
    },
    /** Runs once when the current pass (timeline + tail) finishes. */
    onceLoopEnd(cb) { loopEndCallbacks.push(cb); },
  };
}
