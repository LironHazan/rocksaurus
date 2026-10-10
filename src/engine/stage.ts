import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { disposeObject } from './dispose';
import { dropTinyShadowCasters } from './shadows';
import type { Format, Overlay, Stage } from './types';

/** A touch brighter than neutral: ACES filmic tone mapping darkens the mid-tones a little. */
const EXPOSURE = 1.05;
/** The camera's clip planes, in scene units: close enough for phone close-ups, far enough for the town. */
const NEAR = 0.1;
const FAR = 100;

/**
 * Renderer and camera shared by every episode (lighting comes from the world, e.g. meadow.js).
 * Three.js draws into an offscreen canvas; each frame is composited onto a 2D output canvas together
 * with any overlay (captions). The output canvas is what you see and what gets recorded.
 *
 * The renderer is `WebGPURenderer`, which uses WebGPU where the browser has it and falls back to its own
 * WebGL 2 backend where it does not — so this is not a support cliff, and no feature detection is needed here.
 * It must be initialized before the first frame (`render()` throws otherwise), which is why building a stage
 * is async.
 */
export async function createStage(container: HTMLElement, format: Format): Promise<Stage> {
  const { width, height } = format;
  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  await renderer.init();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported in this browser.');
  container.appendChild(canvas);

  const scenes = new Set<THREE.Scene>();
  const stage: Stage = {
    format,
    renderer,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(format.fov, width / height, NEAR, FAR),
    canvas,
    render(overlay?: Overlay) {
      // a scene's first frame: its cast is in by now, so this is when to decide which shapes throw shadows
      if (!scenes.has(stage.scene)) dropTinyShadowCasters(stage.scene);
      scenes.add(stage.scene);
      renderer.render(stage.scene, stage.camera);
      ctx.drawImage(renderer.domElement, 0, 0);
      overlay?.(ctx);
    },
    dispose() {
      // Scene graphs go first and synchronously, so GPU memory is released even if the device teardown below
      // is still settling. renderer.dispose() is async: on the WebGPU backend it ends in device.destroy(), and
      // on the WebGL fallback in WEBGL_lose_context.loseContext() — three does what forceContextLoss() used to.
      for (const s of scenes.add(stage.scene)) disposeObject(s);
      void renderer.dispose();
      canvas.remove();
    },
  };
  return stage;
}
