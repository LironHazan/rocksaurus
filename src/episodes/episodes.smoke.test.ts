import * as THREE from 'three';
import type { Stage } from '../engine/types';

// Every registered Short, built and played through its whole timeline in jsdom: no browser, no GPU, no shaders, so it
// takes seconds. It catches what typecheck cannot: a Short that throws in setup() or update(t), and geometry with NaN
// vertices (which three.js only reports while rendering). Rendering itself is checked by Playwright (e2e/).

/** Stands in for any browser object jsdom lacks (Web Audio, a 2D canvas): every call and property returns itself. */
const anything: unknown = new Proxy(function () {}, {
  get: (_target, key) => (key === Symbol.toPrimitive ? () => 0 : key === 'then' ? undefined : anything),
  apply: () => anything,
  construct: () => anything as object,
  set: () => true,
});

// The audio graph is built when src/audio/context.ts is imported, so these must exist before the registry loads.
for (const name of [
  'AudioContext',
  'GainNode',
  'BiquadFilterNode',
  'OscillatorNode',
  'WaveShaperNode',
  'StereoPannerNode',
  'DynamicsCompressorNode',
  'AudioBufferSourceNode',
  'ConvolverNode',
  'DelayNode',
])
  vi.stubGlobal(name, anything);
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(anything as never);
Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true });
const { episodes } = await import('./index');
afterAll(() => vi.unstubAllGlobals());

const STEP = 0.25;

function createTestStage(): Stage {
  const format = { label: 'test', width: 1080, height: 1920, fov: 50, safe: { top: 0.17, bottom: 0.745 } };
  return {
    format,
    renderer: anything as Stage['renderer'],
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(format.fov, format.width / format.height, 0.1, 100),
    canvas: document.createElement('canvas'),
    render() {},
    dispose() {},
  };
}

/** Meshes whose positions hold NaN, by name or geometry type. */
function brokenGeometry(scene: THREE.Object3D): string[] {
  const bad: string[] = [];
  scene.traverse(o => {
    const position = (o as THREE.Mesh).geometry?.attributes?.position;
    if (position && Array.from(position.array as ArrayLike<number>).some(Number.isNaN))
      bad.push(o.name || (o as THREE.Mesh).geometry.type);
  });
  return bad;
}

test.each(episodes.map(e => [e.id, e] as const))('%s builds and plays its whole timeline', (_id, episode) => {
  const stage = createTestStage();
  const scenes = new Set<THREE.Scene>();
  const scene = episode.setup(stage);
  for (let t = 0; t <= episode.duration; t += STEP) {
    scene.update(t);
    scenes.add(stage.scene);
  }
  for (const s of scenes) expect(brokenGeometry(s), 'meshes with NaN vertices').toEqual([]);
  scene.dispose?.();
});
