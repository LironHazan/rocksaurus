import { useEffect, useState } from 'react';
import type { WebGPURenderer } from 'three/webgpu';

// The studio's performance readout: how many draw calls and triangles the last frame took (the renderer counts them
// itself, shadow passes included, and resets them every render), and the frame rate the browser actually reached.
// Sampled twice a second, so React re-renders twice a second, not every frame.

export interface FrameStats {
  drawCalls: number;
  triangles: number;
  fps: number;
}

/** How often the readout refreshes (ms), and how far back the frame rate looks (ms). */
const SAMPLE_EVERY_MS = 500;
const FPS_WINDOW_MS = 1000;
const MS_PER_SECOND = 1000;

/** Frames per second over a run of frame timestamps (ms, oldest first): frames between the first and the last. */
export function fpsOf(frameTimes: readonly number[]): number {
  if (frameTimes.length < 2) return 0;
  const span = frameTimes[frameTimes.length - 1]! - frameTimes[0]!;
  return span > 0 ? ((frameTimes.length - 1) * MS_PER_SECOND) / span : 0;
}

/** The renderer's last-frame counters and the browser's frame rate, while `renderer` is set. */
export function useFrameStats(renderer: WebGPURenderer | null): FrameStats | null {
  const [stats, setStats] = useState<FrameStats | null>(null);
  useEffect(() => {
    if (!renderer) return;
    const frames: number[] = [];
    let raf = requestAnimationFrame(function tick(now) {
      frames.push(now);
      // the last second of frames, but always the last two: a page down to 1 fps still reads 1, not 0
      while (frames.length > 2 && now - frames[0]! > FPS_WINDOW_MS) frames.shift();
      raf = requestAnimationFrame(tick);
    });
    const sample = setInterval(() => {
      const { drawCalls, triangles } = renderer.info.render;
      setStats({ drawCalls, triangles, fps: fpsOf(frames) });
    }, SAMPLE_EVERY_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(sample);
      setStats(null);
    };
  }, [renderer]);
  return stats;
}
