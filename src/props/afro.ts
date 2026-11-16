import * as THREE from 'three';
import { rng } from '../engine/math';

// An afro puff: curly hair pulled up snug over the head into a big round puff of curls high on the crown, tied with a
// scrunchie. The curls are instanced meshes (hundreds of them, a draw call each for the cap and the puff) over solid
// cores, so nothing shows through between them.

/** A cloud of curls: its centre and radii (head units, around the rig's `face` group), how many curls, their radius. */
interface Cloud {
  center: THREE.Vector3;
  radii: THREE.Vector3;
  curls: number;
  size: readonly [min: number, max: number];
}
/** The snug cap over the head (a little bigger than the head), and the puff up on the crown. */
const CAP: Cloud = {
  center: new THREE.Vector3(0, 0.04, -0.04),
  radii: new THREE.Vector3(0.64, 0.58, 0.7),
  curls: 240,
  size: [0.06, 0.09],
};
const PUFF: Cloud = {
  center: new THREE.Vector3(0, 0.82, -0.3),
  radii: new THREE.Vector3(0.48, 0.44, 0.48),
  curls: 200,
  size: [0.09, 0.13],
};
/** The scrunchie at the puff's base: where, how big round, how thick. */
const SCRUNCHIE = { at: new THREE.Vector3(0, 0.5, -0.24), r: 0.2, tube: 0.06 } as const;
/** A core is its cloud this much smaller: it fills in under the curls. */
const CORE = 0.9;
/** The hairline on the cap: no curls on the front (direction's z above `front`) lower than `y`, so the eyes and face
 * stay clear; none under the jaw (`under`) but at the back. */
const HAIRLINE = { front: 0.35, y: 0.32, under: -0.2, back: -0.3 } as const;
/** The golden angle (radians): spreads the curls evenly over a cloud. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Whether a cap curl at `p` (head space), in direction `d` from the cap's centre, is on the face or under the jaw. */
const offHair = (p: THREE.Vector3, d: THREE.Vector3) =>
  (d.z > HAIRLINE.front && p.y < HAIRLINE.y) || (p.y < HAIRLINE.under && d.z > HAIRLINE.back);

/** A cloud's core and its curls (evenly over its surface: a Fibonacci sphere), less any `skip` says to leave out. */
function curlCloud(
  cloud: Cloud,
  hair: THREE.Material,
  r: () => number,
  skip: (p: THREE.Vector3, d: THREE.Vector3) => boolean = () => false,
): THREE.Group {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), hair);
  core.scale.copy(cloud.radii).multiplyScalar(CORE);
  core.position.copy(cloud.center);
  g.add(core);
  const spots: THREE.Matrix4[] = [];
  const d = new THREE.Vector3();
  for (let i = 0; i < cloud.curls; i++) {
    const y = 1 - (2 * (i + 0.5)) / cloud.curls;
    const ring = Math.sqrt(1 - y * y);
    d.set(Math.cos(i * GOLDEN) * ring, y, Math.sin(i * GOLDEN) * ring);
    const p = d
      .clone()
      .multiply(cloud.radii)
      .multiplyScalar(0.97 + r() * 0.06)
      .add(cloud.center);
    if (skip(p, d)) continue;
    const size = cloud.size[0] + r() * (cloud.size[1] - cloud.size[0]);
    spots.push(new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(size, size, size)));
  }
  const curls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), hair, spots.length);
  spots.forEach((m, i) => curls.setMatrixAt(i, m));
  curls.castShadow = true;
  g.add(curls);
  return g;
}

/** Adds an afro puff to `rig`'s head; returns its group. */
export function addAfroPuff(
  rig: { face: THREE.Object3D },
  { color = 0x2a1a12, scrunchie = 0xffd23f, seed = 9 } = {},
): THREE.Group {
  const r = rng(seed);
  const hair = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const group = new THREE.Group();
  const cap = curlCloud(CAP, hair, r, offHair);
  // the cap's core stays inside the head at the front, so it can't show under the hairline
  cap.children[0]!.position.z -= 0.08;
  const tie = new THREE.Mesh(
    new THREE.TorusGeometry(SCRUNCHIE.r, SCRUNCHIE.tube, 10, 28),
    new THREE.MeshStandardMaterial({ color: scrunchie, roughness: 0.7 }),
  );
  tie.position.copy(SCRUNCHIE.at);
  tie.rotation.x = Math.PI / 2 - 0.4; // around the puff's base, tipped back with it
  group.add(cap, curlCloud(PUFF, hair, r), tie);
  rig.face.add(group);
  return group;
}
