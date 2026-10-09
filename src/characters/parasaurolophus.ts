import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { growTail } from './tail';
import { taperedTube } from '../props/tube';
import type { CharacterRig } from './types';

export const PARIS_COLORS = {
  body: 0x4fd1c5, // turquoise
  belly: 0xe8fff9,
  bill: 0xbff3ea,
  spots: 0x2fb3a6,
  crest: 0xff8f4d, // coral
  crestStripe: 0xe8663a,
  cheeks: 0xff9eb5,
};

export interface ParasaurolophusRig extends CharacterRig {
  /** The long crest — `setCrestGlow(k)` lights it up (she sings through it). */
  crest: THREE.Group;
  setCrestGlow(k: number): void;
}

/**
 * Paris — the band's lead singer: a Parasaurolophus with a long, swept-back coral crest, a duck-bill snout
 * whose lower bill opens when she sings, big lashed eyes, and a standing rock-singer build.
 */
export function createParasaurolophus(colors = PARIS_COLORS): ParasaurolophusRig {
  const crestMat = new THREE.MeshPhysicalMaterial({
    color: colors.crest,
    roughness: 0.6,
    sheen: 1,
    sheenColor: new THREE.Color(0xffffff),
    emissive: colors.crest,
    emissiveIntensity: 0,
  });
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    bill: plush(colors.bill),
    spot: plush(colors.spots),
    stripe: plush(colors.crestStripe),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x1f3a38),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const torso = new THREE.Group();
  squash.add(torso);
  torso.add(ball(1, M.body, [0, 1.25, 0], [0.95, 1.15, 0.9]));
  torso.add(ball(0.72, M.belly, [0, 1.15, 0.45], [1, 1.2, 0.55]));
  for (const [x, y, z, r] of [
    [0.4, 1.7, -0.6, 0.14],
    [-0.45, 1.4, -0.65, 0.12],
    [0.15, 1.05, -0.85, 0.13],
    [-0.2, 1.85, -0.5, 0.1],
  ] as const) {
    torso.add(ball(r, M.spot, [x, y, z], [1, 1, 0.35]));
  }

  const feet: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    torso.add(ball(0.5, M.body, [s * 0.55, 0.62, 0.02]));
    const foot = new THREE.Group();
    foot.position.set(s * 0.52, 0, 0.3);
    foot.add(ball(0.4, M.body, [0, 0.2, 0], [1, 0.6, 1.25]));
    for (let k = -1; k <= 1; k++) foot.add(ball(0.08, M.belly, [k * 0.14, 0.17, 0.48]));
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.9, -0.75);
  tail.add(
    growTail(M.body, {
      spine: [
        [0, 0.3, 0.5],
        [0, 0.05, -0.3],
        [0, -0.25, -1.0],
        [0, -0.48, -1.6],
        [0, -0.56, -1.95],
      ],
      base: 0.55,
      tip: 0.05,
      taper: 1.2,
    }),
  );
  torso.add(tail);

  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.62, 1.8, 0.5);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.28, 8, 16), M.body);
    arm.position.y = -0.2;
    pivot.add(arm);
    pivot.userData.side = s;
    torso.add(pivot);
    arms.push(pivot);
  }

  torso.add(ball(0.45, M.body, [0, 2.25, 0.2], [1, 1.1, 1]));
  const head = new THREE.Group();
  head.position.set(0, 2.68, 0.32);
  head.add(ball(0.5, M.body, [0, 0, 0], [1, 0.9, 1.15]));
  head.add(ball(0.38, M.bill, [0, -0.13, 0.55], [1.15, 0.5, 1.25])); // upper duck bill
  for (const s of [-1, 1]) head.add(ball(0.03, M.dark, [s * 0.1, -0.05, 0.98], [1.2, 0.7, 0.6], 10)); // nostrils

  // lower bill on a hinge: opens with setMouth()
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.24, 0.12);
  jaw.add(ball(0.34, M.bill, [0, -0.05, 0.45], [1.05, 0.28, 1.2]));
  jaw.add(ball(0.28, matte(0x3a1a2a), [0, 0.02, 0.42], [0.95, 0.12, 1.1])); // inside of the mouth
  jaw.add(ball(0.14, matte(0xff7a93), [0, 0.04, 0.5], [1, 0.3, 1.4])); // tongue
  head.add(jaw);

  // the crest: a long tube sweeping back from the top of the head, with darker bands
  const crest = new THREE.Group();
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.28, 0.25),
    new THREE.Vector3(0, 0.6, -0.15),
    new THREE.Vector3(0, 0.78, -0.75),
    new THREE.Vector3(0, 0.7, -1.35),
  ]);
  crest.add(
    new THREE.Mesh(
      taperedTube(path, s => 0.15 - s * 0.04, { segments: 48, radial: 20 }),
      crestMat,
    ),
  );
  crest.add(ball(0.11, crestMat, [0, 0.7, -1.35])); // rounded tip
  for (const s of [0.35, 0.55, 0.75]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15 - s * 0.04, 0.025, 8, 24), M.stripe);
    ring.position.copy(path.getPointAt(s));
    ring.lookAt(ring.position.clone().add(path.getTangentAt(s)));
    crest.add(ring);
  }
  head.add(crest);

  const eyes: THREE.Group[] = [];
  const cheeks: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.29, 0.12, 0.42);
    eye.rotation.y = s * 0.35;
    eye.add(ball(0.15, M.eye, [0, 0, 0], [1, 1.1, 0.6]));
    eye.add(ball(0.05, M.shine, [0.04, 0.05, 0.085], [1, 1, 0.4], 12));
    eye.add(ball(0.022, M.shine, [-0.035, -0.045, 0.085], [1, 1, 0.4], 12));
    for (const th of [0.4, 0.85, 1.3]) {
      // lashes on the outer corner
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.06, 4, 6), M.dark);
      lash.position.set(s * Math.cos(th) * 0.17, Math.sin(th) * 0.18, 0.02);
      lash.rotation.z = -s * (Math.PI / 2 - th);
      eye.add(lash);
    }
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.1, M.cheek, [s * 0.36, -0.14, 0.42], [1, 0.7, 0.35]);
    head.add(cheek);
    cheeks.push(cheek);
  }
  torso.add(head);
  enableShadows(root);

  return {
    root,
    squash,
    torso,
    head,
    eyes,
    cheeks,
    arms,
    feet,
    tail,
    crest,
    setMouth(k) {
      jaw.rotation.x = k * 0.5;
    },
    setFrown() {},
    setCrestGlow(k) {
      crestMat.emissiveIntensity = k * 0.6;
    },
  };
}
