import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { reachArm } from './reach';
import { taperedTube } from '../props/tube';
import type { CharacterRig } from './types';

export const RORIT_COLORS = {
  body: 0x7ed6a5, // mint
  belly: 0xeafff2,
  spots: 0x5bbf8a,
  beak: 0xffd2a8,
  cheeks: 0xff9eb5,
  eyes: 0x2fa86b, // green iris
  top: 0xff6f91, // the cropped sports top
  leggings: 0x26232e,
  sneakers: 0xf7f7f7,
  soles: 0xff6f91,
};

/** Height of the hips above the ground, and where the body's underside is (it rests on a seat there). */
export const ORNITHO_HIP = 1.4;
export const ORNITHO_SEAT = 1.25;
const THIGH = 0.55;
const SHIN = 0.6;
const ANKLE = 0.12; // the ankle's height above the foot's sole

export interface OrnithomimusRig extends CharacterRig {
  neck: THREE.Group;
  /** Lulu-sized head anchor, scaled to this head, so Lulu's hair props (ponytail) fit. */
  face: THREE.Group;
  /** Leg pivots at the hips; the legs follow the feet when `updateLegs()` is called. */
  legs: THREE.Group[];
  /**
   * Re-aims both legs from the hips to wherever the feet are now (knees bend forward). Call after posing.
   * `seated` (0..1) puts the knees straight out in front of the hips, thighs along the seat.
   */
  updateLegs(seated?: number): void;
  /** Seated on something high (she's small): feet dangling under the knees. Sets the feet; then `updateLegs(1)`. */
  dangleFeet(swing?: number): void;
}

/**
 * Rorit — a small, slim, very fit Ornithomimus (the "ostrich dinosaur", built to run): a slender upright body
 * with a hint of abs between a cropped sports top and high-waisted leggings, long legs, white sneakers, a long
 * neck, a small head with a beak and big lashed green eyes, toned arms with a fitness band. Same rig shape as the others, so idle(), resetPose() and reachArm() work;
 * the legs are two-bone, re-aimed to the feet by `updateLegs()`.
 */
export function createOrnithomimus(colors = RORIT_COLORS): OrnithomimusRig {
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    spot: plush(colors.spots),
    beak: plush(colors.beak),
    top: new THREE.MeshPhysicalMaterial({ color: colors.top, roughness: 0.45, sheen: 0.6 }),
    leggings: new THREE.MeshPhysicalMaterial({ color: colors.leggings, roughness: 0.35, sheen: 0.8 }),
    sneaker: matte(colors.sneakers),
    sole: matte(colors.soles),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x1f2a24),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const torso = new THREE.Group();
  squash.add(torso);

  // slim upright body: mint skin, a cropped top over the chest, high-waisted leggings below
  const R = { x: 0.55, y: 0.8, z: 0.5 };
  const BODY_Y = 2.0;
  torso.add(ball(1, M.body, [0, BODY_Y, 0], [R.x, R.y, R.z]));
  torso.add(ball(0.4, M.belly, [0, 2.05, 0.28], [1, 1.2, 0.5]));
  const band = (from: number, to: number, material: THREE.Material, grow: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, from * Math.PI, (to - from) * Math.PI),
      material,
    );
    m.scale.set(R.x * grow, R.y * grow, R.z * grow);
    m.position.y = BODY_Y;
    return m;
  };
  torso.add(band(0.2, 0.42, M.top, 1.035)); // sports top
  torso.add(band(0.62, 1.0, M.leggings, 1.03)); // high waist
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 40), M.leggings);
  waistband.rotation.x = Math.PI / 2;
  waistband.scale.set(R.x * 0.95, R.z * 0.95, 1);
  waistband.position.y = BODY_Y - Math.cos(0.62 * Math.PI) * -R.y;
  torso.add(waistband);
  // a hint of abs on the midriff, between the top and the leggings
  const abs = plush(new THREE.Color(colors.belly).multiplyScalar(0.9).getHex());
  for (const y of [1.78, 1.92])
    for (const s of [-1, 1]) torso.add(ball(0.075, abs, [s * 0.08, y, 0.43], [1, 0.8, 0.3], 12));
  for (const [x, y, z, r] of [
    [0.3, 2.2, -0.42, 0.08],
    [-0.28, 2.0, -0.45, 0.07],
    [0.05, 2.4, -0.38, 0.06],
  ] as const)
    torso.add(ball(r, M.spot, [x, y, z], [1, 1, 0.35]));

  // legs: hip pivots, two bones each (re-aimed every frame); feet are sneakers on the ground
  const legs: THREE.Group[] = [];
  const feet: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.26, ORNITHO_HIP, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, THIGH - 0.3, 8, 16), M.leggings);
    thigh.position.y = -THIGH / 2;
    leg.add(thigh);
    leg.userData.side = s;
    squash.add(leg);
    legs.push(leg);

    const foot = new THREE.Group();
    foot.position.set(s * 0.3, 0, 0.12);
    foot.add(ball(0.2, M.sneaker, [0, 0.12, 0.08], [1, 0.6, 1.5]));
    foot.add(ball(0.21, M.sole, [0, 0.05, 0.08], [1, 0.25, 1.52]));
    foot.add(ball(0.06, M.sole, [0, 0.2, 0.3], [1.6, 0.4, 0.6])); // laces
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }
  const ankle = new THREE.Vector3(),
    knee = new THREE.Vector3(),
    mid = new THREE.Vector3();
  const seatedKnee = new THREE.Vector3();
  function updateLegs(seated = 0) {
    legs.forEach((leg, i) => {
      const foot = feet[i]!;
      ankle.copy(foot.position).add(new THREE.Vector3(0, ANKLE, 0));
      const d = leg.position.distanceTo(ankle);
      // knee: halfway down, pushed forward by however much the leg is bent
      const bend = Math.sqrt(Math.max(0, ((THIGH + SHIN) / 2) ** 2 - (d / 2) ** 2));
      mid.lerpVectors(leg.position, ankle, 0.5);
      knee.copy(mid).add(new THREE.Vector3(0, 0, bend + 0.04));
      if (seated > 0) knee.lerp(seatedKnee.copy(leg.position).add(new THREE.Vector3(0, -0.06, THIGH)), seated);
      reachArm(leg, ankle, knee);
    });
  }

  // a long, slim tail
  const tail = new THREE.Group();
  tail.position.set(0, 1.55, -0.35);
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.7, 20), M.body);
  tailCone.rotation.x = -Math.PI / 2 + 0.45;
  tailCone.position.set(0, -0.3, -0.75);
  tail.add(tailCone);
  torso.add(tail);

  // long, thin arms; a fitness band on the left wrist
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.48, 2.45, 0.15);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.42, 8, 16), M.body);
    arm.position.y = -0.29;
    pivot.add(arm);
    pivot.add(ball(0.1, M.body, [0, -0.17, 0.04], [1, 1.3, 1], 16)); // toned
    if (s < 0) {
      const watch = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 20), M.dark);
      watch.rotation.x = Math.PI / 2;
      watch.position.y = -0.45;
      pivot.add(watch);
    }
    pivot.userData.side = s;
    torso.add(pivot);
    arms.push(pivot);
  }

  // the neck: a slender S up from the shoulders
  const neckPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.55, 0.0),
    new THREE.Vector3(0, 3.0, 0.12),
    new THREE.Vector3(0, 3.4, 0.08),
    new THREE.Vector3(0, 3.62, 0.18),
  ]);
  const neck = new THREE.Group();
  neck.add(
    new THREE.Mesh(
      taperedTube(neckPath, s => 0.22 - s * 0.08, { segments: 24, radial: 16 }),
      M.body,
    ),
  );
  neck.add(ball(0.22, M.body, [0, 2.55, 0]));
  torso.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 3.78, 0.22);
  head.add(ball(0.4, M.body, [0, 0, 0], [1, 0.92, 1.1]));
  head.add(ball(0.24, M.beak, [0, -0.1, 0.4], [0.85, 0.55, 1.25])); // the beak
  for (const s of [-1, 1]) head.add(ball(0.018, M.dark, [s * 0.07, -0.03, 0.68], [1.2, 0.8, 0.6], 10));

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 20, Math.PI), M.dark);
  smile.rotation.set(-0.2, 0, Math.PI);
  smile.position.set(0, -0.17, 0.6);
  head.add(smile);
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.2, 0.6);
  mouth.add(ball(0.08, matte(0x3a1a2a), [0, 0, 0], [1.1, 0.9, 0.5]));
  mouth.add(ball(0.05, matte(0xff7a93), [0, -0.03, 0.03], [1.2, 0.6, 0.4]));
  mouth.visible = false;
  head.add(mouth);

  const eyes: THREE.Group[] = [];
  const cheeks: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.2, 0.1, 0.3);
    eye.rotation.y = s * 0.4;
    eye.add(
      ball(
        0.13,
        new THREE.MeshPhysicalMaterial({ color: colors.eyes, roughness: 0.15, clearcoat: 1 }),
        [0, 0, 0],
        [1, 1.1, 0.6],
      ),
    );
    eye.add(ball(0.075, M.eye, [0, -0.01, 0.05], [1, 1.1, 0.5]));
    eye.add(ball(0.04, M.shine, [0.04, 0.045, 0.085], [1, 1, 0.4], 12));
    for (const th of [0.4, 0.85, 1.3]) {
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.05, 4, 6), M.dark);
      lash.position.set(s * Math.cos(th) * 0.15, Math.sin(th) * 0.16, 0.02);
      lash.rotation.z = -s * (Math.PI / 2 - th);
      eye.add(lash);
    }
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.07, M.cheek, [s * 0.27, -0.1, 0.3], [1, 0.7, 0.35]) as THREE.Mesh;
    head.add(cheek);
    cheeks.push(cheek);
  }
  // Lulu's hair props are built for her head (radius 0.6): this anchor scales them to Rorit's
  const face = new THREE.Group();
  face.scale.setScalar(0.4 / 0.6);
  face.position.set(0, 0.02, -0.02);
  head.add(face);
  torso.add(head);

  function dangleFeet(swing = 0) {
    feet.forEach((foot, i) => {
      const s = foot.userData.side as number;
      const kick = Math.sin(swing + i * Math.PI) * 0.12;
      foot.position.set(s * 0.28, ORNITHO_HIP - 0.06 - SHIN - ANKLE + Math.abs(kick) * 0.3, THIGH + 0.02 + kick);
    });
  }

  enableShadows(root);
  updateLegs();

  return {
    root,
    squash,
    torso,
    neck,
    head,
    face,
    eyes,
    cheeks,
    arms,
    legs,
    feet,
    tail,
    updateLegs,
    dangleFeet,
    setMouth(k) {
      smile.visible = k < 0.05;
      mouth.visible = k >= 0.05;
      mouth.scale.set(0.6 + 0.4 * k, k, 1);
    },
    setFrown(on) {
      smile.rotation.z = on ? 0 : Math.PI;
    },
  };
}
