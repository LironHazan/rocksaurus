import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { taperedTube } from '../props/tube';

export const TIKI_COLORS = {
  body: 0x6fbbea, // sky blue
  stripes: 0x3a78b8, // darker blue tiger stripes
  belly: 0xfff0dc,
  brow: 0x4f97d6,
  cheeks: 0xffb3c1,
  teeth: 0xffffff,
  claws: 0xfff3e0,
};

/**
 * Tiki Taka — a big, cool Tyrannosaurus (a different build from Rory): taller, leaning slightly forward,
 * long head with a long snout, an opening lower jaw with little teeth, brow ridges, back stripes,
 * chunky legs, a long heavy tail and tiny arms.
 * Same rig shape as Rory (root, squash, torso, head, eyes, cheeks, arms, feet, tail, setMouth, setFrown),
 * so idle(), resetPose() and reachArm() work on him too. Head is long: `snoutTip` is the front of the face.
 */
export function createTyrannosaurus(colors = TIKI_COLORS) {
  const M = {
    body: plush(colors.body),
    stripe: plush(colors.stripes),
    belly: plush(colors.belly),
    brow: plush(colors.brow),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x1f2a3a),
    tooth: new THREE.MeshStandardMaterial({ color: colors.teeth, roughness: 0.4 }),
    claw: plush(colors.claws),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const torso = new THREE.Group();
  squash.add(torso);
  const posture = new THREE.Group(); // fixed forward lean, under the animated torso
  posture.rotation.x = 0.1;
  torso.add(posture);

  posture.add(ball(1, M.body, [0, 1.45, 0], [1.0, 1.25, 1.05]));
  posture.add(ball(0.8, M.belly, [0, 1.3, 0.52], [1, 1.25, 0.55]));

  // tiger stripes: flat dark patches lying on the skin across the back and sides
  const BODY = { c: new THREE.Vector3(0, 1.45, 0), r: new THREE.Vector3(1.0, 1.25, 1.05) };
  for (let i = 0; i < 5; i++) {
    const y = 0.85 + i * 0.3;
    for (const phi of [-1.15, -0.6, 0, 0.6, 1.15]) {
      // around the back, from side to side
      // point on the body ellipsoid at height y, angle phi around the back; normal for orientation
      const h = (y - BODY.c.y) / BODY.r.y,
        ring = Math.sqrt(Math.max(0, 1 - h * h));
      const pos = new THREE.Vector3(Math.sin(phi) * ring * BODY.r.x, y - BODY.c.y, -Math.cos(phi) * ring * BODY.r.z);
      const n = new THREE.Vector3(pos.x / BODY.r.x ** 2, pos.y / BODY.r.y ** 2, pos.z / BODY.r.z ** 2).normalize();
      pos.add(BODY.c);
      const patch = ball(1, M.stripe, [0, 0, 0], [0.3 - Math.abs(phi) * 0.06, 0.07, 0.05], 20);
      patch.position.copy(pos);
      patch.lookAt(pos.clone().add(n));
      patch.rotateZ(0.25 * Math.sign(phi || 1) * (i % 2 ? 1 : -1) * 0.5); // slight zig-zag, like real stripes
      posture.add(patch);
    }
  }

  const feet = [];
  for (const s of [-1, 1]) {
    posture.add(ball(0.62, M.body, [s * 0.62, 0.78, 0.0], [1, 1.1, 1.1])); // chunky thighs
    const foot = new THREE.Group();
    foot.position.set(s * 0.6, 0, 0.35);
    foot.add(ball(0.45, M.body, [0, 0.2, 0], [1, 0.55, 1.35]));
    for (let k = -1; k <= 1; k++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 10), M.claw);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(k * 0.16, 0.12, 0.62);
      foot.add(claw);
    }
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  // long heavy tail, reaching back toward the floor
  const tail = new THREE.Group();
  tail.position.set(0, 0.95, -0.8);
  // one smooth taper that starts inside the body, so it grows out of the back instead of being stuck on
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.05, 0.5),
    new THREE.Vector3(0, -0.3, -0.4),
    new THREE.Vector3(0, -0.55, -1.3),
    new THREE.Vector3(0, -0.72, -2.2),
    new THREE.Vector3(0, -0.78, -2.95),
  ]);
  tail.add(
    new THREE.Mesh(
      taperedTube(spine, s => 0.04 + 0.6 * (1 - s) ** 1.15, { segments: 48, radial: 28 }),
      M.body,
    ),
  );
  tail.add(ball(0.06, M.body, [0, -0.78, -2.95])); // rounded tip
  posture.add(tail);

  // tiny arms
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.62, 1.95, 0.72);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 8, 16), M.body);
    arm.position.y = -0.16;
    pivot.add(arm);
    pivot.userData.side = s;
    posture.add(pivot);
    arms.push(pivot);
  }

  // short thick neck + big long head
  posture.add(ball(0.62, M.body, [0, 2.55, 0.2]));
  const head = new THREE.Group();
  head.position.set(0, 2.85, 0.3);
  head.add(ball(0.75, M.body, [0, 0, 0.3], [1, 0.85, 1.45])); // skull
  head.add(ball(0.55, M.body, [0, -0.15, 1.15], [1, 0.78, 1.2])); // long snout
  for (const s of [-1, 1]) {
    head.add(ball(0.2, M.brow, [s * 0.4, 0.4, 0.85], [1.2, 0.55, 1.1])); // brow ridges
    head.add(ball(0.04, M.dark, [s * 0.14, 0.02, 1.78], [1.2, 0.8, 0.6], 12)); // nostrils
  }
  const snoutTip = new THREE.Vector3(0, -0.1, 1.8);

  // upper teeth along the snout edge (little and friendly)
  for (const s of [-1, 1]) {
    for (let z = 0.75; z <= 1.65; z += 0.15) {
      const k = 1 - ((z - 1.15) / 0.66) ** 2 - 0.5;
      if (k <= 0) continue;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 8), M.tooth);
      tooth.rotation.x = Math.PI;
      tooth.position.set(s * 0.55 * Math.sqrt(k), -0.45, z);
      head.add(tooth);
    }
  }

  // lower jaw: hinged near the back of the head, opens with setMouth()
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.38, 0.35);
  jaw.add(ball(0.5, M.body, [0, -0.08, 0.6], [0.95, 0.32, 1.45]));
  jaw.add(ball(0.42, matte(0x3a1a2a), [0, 0.04, 0.62], [0.85, 0.12, 1.3])); // mouth inside (shows when open)
  jaw.add(ball(0.2, matte(0xff7a93), [0, 0.07, 0.75], [1, 0.35, 1.6])); // tongue
  head.add(jaw);

  const eyes = [],
    cheeks = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.43, 0.2, 1.02);
    eye.rotation.y = s * 0.35;
    eye.add(ball(0.18, M.eye, [0, 0, 0], [1, 1.08, 0.6]));
    eye.add(ball(0.055, M.shine, [0.05, 0.06, 0.1], [1, 1, 0.4], 12));
    eye.add(ball(0.025, M.shine, [-0.04, -0.05, 0.1], [1, 1, 0.4], 12));
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.14, M.cheek, [s * 0.58, -0.12, 0.95], [1, 0.7, 0.35]);
    cheek.rotation.y = s * 0.6;
    head.add(cheek);
    cheeks.push(cheek);
  }
  posture.add(head);
  enableShadows(root);

  return {
    root,
    squash,
    torso,
    posture,
    head,
    jaw,
    snoutTip,
    eyes,
    cheeks,
    arms,
    feet,
    tail,
    /** 0 = closed, 1 = wide open */
    setMouth(k) {
      jaw.rotation.x = k * 0.45;
    },
    setFrown() {},
  };
}
