import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { growTail } from './tail';

const LULU_COLORS = {
  body: 0xb48ce8, // lavender (saturated enough to stay purple under stage lights)
  belly: 0xf1e2ff,
  spots: 0xff8fcf, // pink
  cheeks: 0xffb3c1,
  flower: 0xff7eb6,
  eyes: 0x3d8ef0, // iris color (null = classic all-dark cartoon eyes)
};

const BODY = { y: 1, rx: 1.05, ry: 0.95, rz: 1 }; // body ellipsoid
const NECK_REST: readonly number[] = [-0.15, 0.05, 0.12, 0.15]; // gentle S-curve, base → head

/** Places a flattened blob on a surface, facing along its normal. */
function stickOn(mesh: THREE.Object3D, pos: THREE.Vector3, normal: THREE.Vector3) {
  mesh.position.copy(pos);
  mesh.lookAt(pos.clone().add(normal));
  return mesh;
}
function onBody(x: number, y: number, z: number): [THREE.Vector3, THREE.Vector3] {
  const n = new THREE.Vector3(x / BODY.rx, (y - BODY.y) / BODY.ry, z / BODY.rz).normalize();
  const pos = new THREE.Vector3(n.x * BODY.rx, BODY.y + n.y * BODY.ry, n.z * BODY.rz).multiplyScalar(0.985);
  return [pos, n];
}

function drumstick() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xe8c896, roughness: 0.6 });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.85, 10), wood);
  stick.position.y = 0.425;
  g.add(stick, ball(0.04, wood, [0, 0.86, 0], [1, 1.3, 1], 12));
  return g;
}

/**
 * Lulu, the long-neck drummer. Sits upright (on a drum throne) with tiny arms holding drumsticks.
 * Rig: root, squash, body, neck[4] (rotate .x to bend), head, face (head center), flower, eyes, cheeks,
 * arms (userData.side), feet, tail, sticks, setMouth(k). Call idleLulu() every frame for breathing, neck sway and blinking.
 */
export function createLulu(colors = LULU_COLORS) {
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    spot: plush(colors.spots),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x3a2a4a),
    flower: plush(colors.flower),
    center: plush(0xffd36b),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const body = new THREE.Group();
  squash.add(body);
  body.add(ball(1, M.body, [0, BODY.y, 0], [BODY.rx, BODY.ry, BODY.rz]));
  body.add(ball(0.7, M.belly, [0, 0.95, 0.48], [1, 1.1, 0.55]));
  for (const [x, y, z, r] of [
    [0.45, 1.5, -0.55, 0.17],
    [-0.5, 1.3, -0.65, 0.14],
    [0.1, 1.8, -0.45, 0.12],
    [-0.2, 0.9, -0.9, 0.16],
    [0.6, 0.85, -0.7, 0.12],
    [-0.8, 1.05, -0.3, 0.11],
    [0.85, 1.25, -0.2, 0.1],
  ] as const) {
    const [pos, n] = onBody(x, y, z);
    body.add(stickOn(ball(r, M.spot, [0, 0, 0], [1, 1, 0.3]), pos, n));
  }

  const feet = [];
  for (const s of [-1, 1]) {
    body.add(ball(0.42, M.body, [s * 0.62, 0.5, 0.3]));
    const foot = new THREE.Group();
    foot.position.set(s * 0.6, 0, 0.62);
    foot.add(ball(0.32, M.body, [0, 0.18, 0], [1, 0.6, 1.2]));
    for (let k = -1; k <= 1; k++) foot.add(ball(0.07, M.belly, [k * 0.11, 0.15, 0.38]));
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.6, -0.8);
  tail.add(
    growTail(M.body, {
      spine: [
        [0, 0.25, 0.55],
        [0, 0.05, -0.3],
        [0, -0.22, -1.1],
        [0, -0.4, -1.8],
        [0, -0.46, -2.35],
      ],
      base: 0.55,
      tip: 0.05,
      taper: 1.2,
    }),
  );
  body.add(tail);

  // tiny arms, each holding a drumstick that points forward and slightly down
  const arms = [],
    sticks = [];
  const up = new THREE.Vector3(0, 1, 0),
    dir = new THREE.Vector3(0, -0.25, 1).normalize();
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.68, 1.45, 0.5);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 8, 16), M.body);
    arm.position.y = -0.16;
    pivot.add(arm);
    const stick = drumstick();
    stick.position.set(0, -0.3, 0.02);
    stick.quaternion.setFromUnitVectors(up, dir);
    pivot.add(stick);
    pivot.userData.side = s;
    body.add(pivot);
    arms.push(pivot);
    sticks.push(stick);
  }

  // long neck: a chain of segments, each one a child of the previous
  const neck: THREE.Group[] = [];
  const SEG = 0.5;
  let parent = body;
  for (let i = 0; i < NECK_REST.length; i++) {
    const seg = new THREE.Group();
    if (i === 0) seg.position.set(0, 1.7, 0.2);
    else seg.position.y = SEG;
    // smooth taper: each segment is a cone frustum from this radius to the next, with a ball at the joint
    const r0 = THREE.MathUtils.lerp(0.42, 0.26, i / NECK_REST.length);
    const r1 = THREE.MathUtils.lerp(0.42, 0.26, (i + 1) / NECK_REST.length);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, SEG, 24), M.body);
    mesh.position.y = SEG / 2;
    seg.add(mesh, ball(r1, M.body, [0, SEG, 0], [1, 1, 1], 24));
    if (i === 0) seg.add(ball(r0, M.body, [0, 0, 0], [1, 1, 1], 24));
    const r = (r0 + r1) / 2;
    if (i % 2 === 0)
      seg.add(
        stickOn(
          ball(0.09, M.spot, [0, 0, 0], [1, 1, 0.3]),
          new THREE.Vector3(0.05, SEG / 2, -r * 0.97),
          new THREE.Vector3(0.1, 0, -1).normalize(),
        ),
      );
    seg.rotation.x = NECK_REST[i]!;
    parent.add(seg);
    parent = seg;
    neck.push(seg);
  }

  const head = new THREE.Group();
  head.position.y = SEG;
  parent.add(head);
  const face = new THREE.Group(); // head center, offset so the neck joins underneath
  face.position.set(0, 0.3, 0.15);
  head.add(face);
  face.add(ball(0.6, M.body, [0, 0, 0], [1, 0.9, 1.1]));
  face.add(ball(0.4, M.body, [0, -0.12, 0.4], [1, 0.7, 0.9])); // snout
  for (const s of [-1, 1]) face.add(ball(0.025, M.dark, [s * 0.09, -0.05, 0.76], [1.2, 0.8, 0.6], 10)); // nostrils

  const eyes = [],
    cheeks = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.26, 0.12, 0.55);
    eye.rotation.y = s * 0.3;
    if (colors.eyes != null) {
      // colored iris + dark pupil
      eye.add(
        ball(
          0.17,
          new THREE.MeshPhysicalMaterial({ color: colors.eyes, roughness: 0.15, clearcoat: 1 }),
          [0, 0, 0],
          [1, 1.1, 0.6],
        ),
      );
      eye.add(ball(0.095, M.eye, [0, -0.01, 0.06], [1, 1.1, 0.5]));
    } else {
      eye.add(ball(0.17, M.eye, [0, 0, 0], [1, 1.1, 0.6]));
    }
    eye.add(ball(0.055, M.shine, [0.05, 0.06, 0.11], [1, 1, 0.4], 12));
    eye.add(ball(0.025, M.shine, [-0.04, -0.05, 0.11], [1, 1, 0.4], 12));
    for (const th of [0.35, 0.8, 1.25]) {
      // eyelashes on the outer corner
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.06, 4, 6), M.dark);
      const d = new THREE.Vector2(s * Math.cos(th), Math.sin(th));
      lash.position.set(d.x * 0.2, d.y * 0.21, 0.02);
      lash.rotation.z = -s * (Math.PI / 2 - th);
      eye.add(lash);
    }
    face.add(eye);
    eyes.push(eye);
    const cheek = ball(0.1, M.cheek, [s * 0.36, -0.12, 0.44], [1, 0.7, 0.35]);
    face.add(cheek);
    cheeks.push(cheek);
  }

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 8, 20, Math.PI), M.dark);
  smile.rotation.set(-0.25, 0, Math.PI);
  smile.position.set(0, -0.19, 0.73);
  face.add(smile);
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.23, 0.71);
  mouth.add(ball(0.09, matte(0x3a1a2a), [0, 0, 0], [1.1, 0.9, 0.5]));
  mouth.add(ball(0.055, matte(0xff7a93), [0, -0.035, 0.03], [1.2, 0.6, 0.4]));
  mouth.visible = false;
  face.add(mouth);

  const flower = new THREE.Group(); // behind her right ear
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI * 2;
    flower.add(ball(0.075, M.flower, [Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0], [1, 1, 0.45]));
  }
  flower.add(ball(0.05, M.center, [0, 0, 0.02]));
  flower.position.set(0.44, 0.3, -0.1);
  flower.rotation.y = Math.PI / 2 - 0.5;
  face.add(flower);
  flower.userData.isFlower = true;

  enableShadows(root);

  function setMouth(k: number) {
    smile.visible = k < 0.05;
    mouth.visible = k >= 0.05;
    mouth.scale.set(0.6 + 0.4 * k, k, 1);
  }

  return { root, squash, body, neck, head, face, flower, eyes, cheeks, arms, sticks, feet, tail, setMouth };
}

/**
 * Breathing, a slow wave down the long neck, sleepy blinking.
 *   nod — extra forward bend spread along the neck (use for headbanging on the beat)
 */
export type LuluRig = ReturnType<typeof createLulu>;

export function idleLulu(rig: LuluRig, t: number, { eyesOpen = 0.75, nod = 0 } = {}): void {
  const breath = Math.sin(t * 2) * 0.02;
  rig.body.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);
  let pitch = 0;
  rig.neck.forEach((seg, i) => {
    seg.rotation.x = NECK_REST[i]! + Math.sin(t * 1.3 - i * 0.7) * 0.035 + nod * (0.3 + i * 0.15);
    seg.rotation.z = Math.sin(t * 0.9 - i * 0.5) * 0.03;
    pitch += seg.rotation.x;
  });
  rig.head.rotation.x = -pitch * 0.85 + nod * 0.25; // keep the face mostly level
  const ph = (t + 1.3) % 3.7;
  const open = Math.min(ph < 0.18 ? Math.abs(ph - 0.09) / 0.09 : 1, eyesOpen);
  for (const e of rig.eyes) e.scale.y = Math.max(0.08, open);
}
