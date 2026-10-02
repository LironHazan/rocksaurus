import * as THREE from 'three';
import { disposeObject } from './dispose';
import type { Format, Overlay, Stage } from './types';

/**
 * Renderer and camera shared by every episode (lighting comes from the world, e.g. meadow.js).
 * Three.js draws into an offscreen WebGL canvas; each frame is composited onto a 2D output canvas together
 * with any overlay (captions). The output canvas is what you see and what gets recorded.
 */
export function createStage(container: HTMLElement, format: Format): Stage {
  const { width, height } = format;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

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
    camera: new THREE.PerspectiveCamera(format.fov, width / height, 0.1, 100),
    canvas,
    render(overlay?: Overlay) {
      scenes.add(stage.scene);
      renderer.render(stage.scene, stage.camera);
      ctx.drawImage(renderer.domElement, 0, 0);
      overlay?.(ctx);
    },
    dispose() {
      for (const s of scenes.add(stage.scene)) disposeObject(s);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
  return stage;
}
