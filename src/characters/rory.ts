import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { growTail } from './tail';
import type { CharacterRig } from './types';

const RORY_COLORS = {
  body: 0xa8e6cf, // mint green
  belly: 0xfff3dc, // cream
  bumps: 0x7fd1ae,
  cheeks: 0xffb3c1,
};

/**
 * Rory, the tiny-armed baby T-Rex.
 * Returns a rig: move `root`, squash `squash`, and pose `head`, `eyes`, `arms`, `tail`.
 * Units: ~3.6 tall, feet at y = 0, facing +z.
 */
export function createRory(colors = RORY_COLORS) {
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    bump: plush(colors.bumps),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x3a4a44),
  };

  const root = new THREE.Group(); // world placement (x, hop height, facing)
  const squash = new THREE.Group(); // squash & stretch around the feet
  root.add(squash);

  const torso = new THREE.Group();
  torso.add(ball(1, M.body, [0, 1.2, 0], [1, 1.1, 0.95]));
  torso.add(ball(0.75, M.belly, [0, 1.1, 0.5], [1, 1.15, 0.55]));
  for (const [y, z] of [
    [2.0, -0.72],
    [1.55, -0.92],
    [1.05, -0.93],
  ] as const)
    torso.add(ball(0.17, M.bump, [0, y, z], [0.8, 1, 1.1]));
  squash.add(torso);

  const feet = [],
    thighs = []; // lift feet with foot.position.y for walking; userData.side = -1 / 1
  for (const s of [-1, 1]) {
    const thigh = ball(0.5, M.body, [s * 0.58, 0.62, 0.02]);
    thigh.userData.side = s;
    torso.add(thigh);
    thighs.push(thigh);
    const foot = new THREE.Group();
    foot.position.set(s * 0.55, 0, 0.3);
    foot.add(ball(0.4, M.body, [0, 0.2, 0], [1, 0.6, 1.25]));
    for (let k = -1; k <= 1; k++) foot.add(ball(0.08, M.belly, [k * 0.14, 0.17, 0.48])); // toes
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.85, -0.75);
  tail.add(
    growTail(M.body, {
      spine: [
        [0, 0.25, 0.55],
        [0, 0, -0.25],
        [0, -0.3, -0.9],
        [0, -0.5, -1.45],
        [0, -0.58, -1.75],
      ],
      base: 0.55,
      tip: 0.05,
      taper: 1.2,
    }),
  );
  torso.add(tail);

  const arms = []; // pivots at the shoulder; userData.side = -1 (left) / 1 (right)
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.72, 1.75, 0.45);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.2, 8, 16), M.body);
    arm.position.y = -0.17;
    pivot.add(arm);
    pivot.userData.side = s;
    torso.add(pivot);
    arms.push(pivot);
  }

  const head = new THREE.Group();
  head.position.set(0, 2.5, 0.1);
  head.add(ball(1.05, M.body, [0, 0, 0], [1.1, 0.95, 1]));
  head.add(ball(0.6, M.body, [0, -0.3, 0.75], [1.1, 0.75, 0.9])); // snout
  const headBump = ball(0.17, M.bump, [0, 0.9, -0.35], [0.8, 1, 1.1]);
  head.add(headBump);
  for (const s of [-1, 1]) head.add(ball(0.04, M.dark, [s * 0.14, -0.14, 1.27], [1.2, 0.8, 0.6], 12)); // nostrils

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 24, Math.PI), M.dark);
  smile.rotation.set(-0.25, 0, Math.PI);
  smile.position.set(0, -0.33, 1.22);
  head.add(smile);

  // open mouth (shout / chomp), shown instead of the smile by setMouth()
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.45, 1.2);
  mouth.add(ball(0.17, matte(0x3a1a2a), [0, 0, 0], [1.15, 0.95, 0.5]));
  mouth.add(ball(0.1, matte(0xff7a93), [0, -0.07, 0.05], [1.2, 0.6, 0.4]));
  mouth.visible = false;
  head.add(mouth);

  const eyes = [],
    cheeks = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.42, 0.15, 0.9);
    eye.rotation.y = s * 0.25;
    eye.add(ball(0.24, M.eye, [0, 0, 0], [1, 1.08, 0.6]));
    eye.add(ball(0.075, M.shine, [0.07, 0.09, 0.14], [1, 1, 0.4], 12));
    eye.add(ball(0.035, M.shine, [-0.06, -0.07, 0.14], [1, 1, 0.4], 12));
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.16, M.cheek, [s * 0.64, -0.2, 0.82], [1, 0.7, 0.35]);
    head.add(cheek);
    cheeks.push(cheek);
  }
  torso.add(head);

  enableShadows(root);

  /** 0 = closed smile, 1 = wide open. */
  function setMouth(k: number) {
    smile.visible = k < 0.05;
    mouth.visible = k >= 0.05;
    mouth.scale.set(0.6 + 0.4 * k, k, 1);
  }

  /** Flip the smile into a frown (sad) and back. */
  function setFrown(on: boolean) {
    smile.rotation.z = on ? 0 : Math.PI;
    smile.position.y = on ? -0.47 : -0.33;
  }

  return { root, squash, torso, head, headBump, eyes, cheeks, arms, thighs, feet, tail, setMouth, setFrown };
}

/** Back to the neutral pose. Call at the start of each frame before layering animation on top. */
export function resetPose(rig: CharacterRig): void {
  rig.root.rotation.set(0, 0, 0);
  rig.squash.scale.set(1, 1, 1);
  rig.torso.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  rig.tail.rotation.set(0, 0, 0);
  for (const a of rig.arms) a.rotation.set(-0.5, 0, a.userData.side * 0.35);
  for (const f of rig.feet) f.position.y = 0;
  for (const e of rig.eyes) e.scale.set(1, 1, 1);
  for (const c of rig.cheeks) c.scale.set(1, 0.7, 0.35);
  rig.setMouth(0);
  rig.setFrown(false);
}

/** Breathing, idle sway and auto-blink — call every frame, then layer episode-specific poses on top. */
export function idle(rig: CharacterRig, t: number, { blinkEvery = 3.1, eyesOpen = 1 } = {}): void {
  const breath = Math.sin(t * 2.2) * 0.02;
  rig.torso.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);
  rig.torso.rotation.z = Math.sin(t * 1.3) * 0.03;
  rig.head.rotation.x = Math.sin(t * 1.1) * 0.04;

  const ph = (t + 0.7) % blinkEvery;
  const open = Math.min(ph < 0.16 ? Math.abs(ph - 0.08) / 0.08 : 1, eyesOpen);
  for (const e of rig.eyes) e.scale.y = Math.max(0.08, open);
}
