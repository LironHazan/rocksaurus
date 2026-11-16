import * as THREE from 'three';
import { rng } from '../engine/math';

// An afro: a big round cloud of tight curls around the head, bigger than the head itself, with a hairline that keeps
// the face clear. The curls are one instanced mesh (hundreds of them, one draw call) over a solid core, so nothing
// shows through between them.

/** The cloud in head space (around the rig's `face` group): its centre, up and back of the head's, and its radii. */
const CLOUD = { center: new THREE.Vector3(0, 0.3, -0.15), radii: new THREE.Vector3(0.92, 0.74, 0.88) } as const;
/** How many curls, and their radius range (head units). */
const CURLS = 320;
const CURL = { min: 0.1, max: 0.15 } as const;
/** The core is the cloud this much smaller: it fills in under the curls. */
const CORE = 0.9;
/** The hairline: no curls on the front of the cloud (direction's z above `front`) lower than `y` (head units), so the
 * eyes and the face stay clear; none under the jaw (`under`) but at the back. */
const HAIRLINE = { front: 0.4, y: 0.52, under: -0.2, back: -0.3 } as const;
/** The golden angle (radians): spreads the curls evenly over the cloud. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Whether a curl at `p` (head space), in direction `d` from the cloud's centre, is on the face or under the jaw. */
const offHair = (p: THREE.Vector3, d: THREE.Vector3) =>
  (d.z > HAIRLINE.front && p.y < HAIRLINE.y) || (p.y < HAIRLINE.under && d.z > HAIRLINE.back);

/** Adds an afro to `rig`'s head; returns its group. */
export function addAfro(rig: { face: THREE.Object3D }, { color = 0x2a1a12, seed = 9 } = {}): THREE.Group {
  const r = rng(seed);
  const hair = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const group = new THREE.Group();

  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), hair);
  core.scale.copy(CLOUD.radii).multiplyScalar(CORE);
  core.position.copy(CLOUD.center);
  group.add(core);

  // the curls, evenly over the cloud's surface (a Fibonacci sphere), each a little bigger or smaller, a little in or out
  const spots: THREE.Matrix4[] = [];
  const d = new THREE.Vector3();
  for (let i = 0; i < CURLS; i++) {
    const y = 1 - (2 * (i + 0.5)) / CURLS;
    const ring = Math.sqrt(1 - y * y);
    d.set(Math.cos(i * GOLDEN) * ring, y, Math.sin(i * GOLDEN) * ring);
    const p = d
      .clone()
      .multiply(CLOUD.radii)
      .multiplyScalar(0.97 + r() * 0.06)
      .add(CLOUD.center);
    if (offHair(p, d)) continue;
    const size = CURL.min + r() * (CURL.max - CURL.min);
    spots.push(new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(size, size, size)));
  }
  const curls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), hair, spots.length);
  spots.forEach((m, i) => curls.setMatrixAt(i, m));
  curls.castShadow = true;
  group.add(curls);

  rig.face.add(group);
  return group;
}
