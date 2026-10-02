import * as THREE from 'three';

/**
 * Renderer and camera shared by every episode (lighting comes from the world, e.g. meadow.js).
 * Three.js draws into an offscreen WebGL canvas; each frame is composited onto a 2D output canvas
 * together with any overlay (captions). The output canvas is what you see and what gets recorded.
 */
export function createStage(container, format) {
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
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(format.fov, width / height, 0.1, 100);

  const api = {
    format, renderer, scene, camera, canvas,
    /** Renders `api.scene` (episodes may swap it to cut between locations), then the overlay. */
    render(overlay) {
      renderer.render(api.scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0);
      overlay?.(ctx);
    },
  };
  return api;
}
