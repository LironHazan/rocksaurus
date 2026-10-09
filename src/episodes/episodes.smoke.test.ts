import * as THREE from 'three';
import { FORMATS } from '../engine/formats';
import type { Stage } from '../engine/types';
import { browserStandIn } from '../test/browser-stand-in';
import { episodes } from './index';

// Every registered Short, built and played through its whole timeline in jsdom: no browser, no GPU, no shaders, so it
// takes seconds. It catches what typecheck cannot: a Short that throws in setup() or update(t), and geometry with NaN
// vertices (which three.js only reports while rendering). Rendering itself is checked by Playwright (e2e/).

// Web Audio and the 2D canvas are stand-ins (src/test/browser-stand-in.ts): this checks the scene graph, not the picture.

/** Seconds between the frames played: fine enough to reach every cue in a timeline. */
const STEP = 0.25;

function createTestStage(): Stage {
  const format = FORMATS.shorts;
  return {
    format,
    renderer: browserStandIn,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(format.fov, format.width / format.height),
    canvas: document.createElement('canvas'),
    render() {},
    dispose() {},
  };
}

/** Meshes whose positions hold NaN, by name or geometry type. */
function brokenGeometry(scene: THREE.Object3D): string[] {
  const bad: string[] = [];
  scene.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    const position = o.geometry.getAttribute('position');
    if (position && Array.from(position.array).some(Number.isNaN)) bad.push(o.name || o.geometry.type);
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
