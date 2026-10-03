import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import type { CharacterRig } from './types';
import { taperedTube } from '../props/tube';

export const STEGGY_COLORS = {
  body: 0xffc857, // warm yellow
  belly: 0xfff1d6,
  plates: 0xff8a65, // coral
  plateTips: 0xffb199,
  spikes: 0xfff3e0,
  cheeks: 0xff9eb5,
  bowTie: 0xd62839,
  eyes: 0x2fa86b, // green iris
  mustache: 0x2a1f18,
};

export interface StegosaurusRig extends CharacterRig {
  /** Back plates, front to back — scale/rotate them to make them bounce to the music. */
  plates: THREE.Group[];
}

/**
 * Steggy — the band's pianist: a round Stegosaurus with two rows of coral back plates, a spiked tail,
 * a small cute head on a short neck and a red bow tie. Built to sit on a piano bench (feet forward).
 */
/** Colors for a Stegosaurus; `mustache: null` for none. */
export type StegosaurusColors = Omit<typeof STEGGY_COLORS, 'mustache'> & { mustache: number | null };

export function createStegosaurus(colors: StegosaurusColors = STEGGY_COLORS): StegosaurusRig {
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    plate: plush(colors.plates),
    tip: plush(colors.plateTips),
    spike: plush(colors.spikes),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x3a2a1a),
    bow: new THREE.MeshStandardMaterial({ color: colors.bowTie, roughness: 0.5 }),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const torso = new THREE.Group();
  squash.add(torso);

  // high-arched body
  torso.add(ball(1, M.body, [0, 1.15, -0.1], [1.0, 0.95, 1.15]));
  torso.add(ball(0.72, M.belly, [0, 1.0, 0.45], [1, 1.05, 0.6]));

  // two alternating rows of back plates along the arch, biggest in the middle
  const plates: THREE.Group[] = [];
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.85, 0.55),
    new THREE.Vector3(0, 2.12, 0.0),
    new THREE.Vector3(0, 2.0, -0.6),
    new THREE.Vector3(0, 1.6, -1.05),
  ]);
  const COUNT = 7;
  for (let i = 1; i < COUNT; i++) {
    // (the frontmost slot is left empty: a plate there pokes up behind the head)
    const s = (i + 0.5) / COUNT;
    const p = spine.getPointAt(s);
    const tangent = spine.getTangentAt(s);
    const side = i % 2 ? 1 : -1;
    const size = 0.55 + Math.sin(Math.PI * s) * 0.45;
    const plate = new THREE.Group();
    plate.position.set(side * 0.1, p.y - 0.05, p.z);
    plate.rotation.set(-Math.atan2(tangent.y, -tangent.z) * 0.6, 0, side * 0.18);
    plate.add(ball(0.3 * size, M.plate, [0, 0.22 * size, 0], [0.9, 1.35, 0.16], 24));
    plate.add(ball(0.12 * size, M.tip, [0, 0.52 * size, 0], [0.8, 1.1, 0.2], 16));
    torso.add(plate);
    plates.push(plate);
  }

  // feet stick forward (sitting); thighs on the sides
  const feet: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    torso.add(ball(0.48, M.body, [s * 0.62, 0.55, 0.15]));
    const foot = new THREE.Group();
    foot.position.set(s * 0.55, 0, 0.55);
    foot.add(ball(0.36, M.body, [0, 0.18, 0], [1, 0.6, 1.25]));
    for (let k = -1; k <= 1; k++) foot.add(ball(0.07, M.belly, [k * 0.12, 0.16, 0.42]));
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  // tail with the classic four spikes
  const tail = new THREE.Group();
  tail.position.set(0, 0.85, -1.05);
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.5, 24), M.body);
  tailCone.rotation.x = -Math.PI / 2 + 0.35;
  tailCone.position.set(0, -0.12, -0.6);
  tail.add(tailCone);
  for (const s of [-1, 1]) {
    for (const z of [-0.95, -1.2]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 12), M.spike);
      spike.position.set(s * 0.12, -0.15, z);
      spike.rotation.set(0.5, 0, -s * 1.0);
      tail.add(spike);
    }
  }
  torso.add(tail);

  // arms (front legs used as arms, a bit longer than a T-Rex's — he has keys to reach)
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.62, 1.5, 0.62);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 8, 16), M.body);
    arm.position.y = -0.21;
    pivot.add(arm);
    pivot.userData.side = s;
    torso.add(pivot);
    arms.push(pivot);
  }

  // short neck + small cute head (stegosaurs have famously tiny heads)
  torso.add(ball(0.36, M.body, [0, 1.75, 0.72], [1, 1.1, 1]));
  const head = new THREE.Group();
  head.position.set(0, 2.08, 0.95);
  head.add(ball(0.5, M.body, [0, 0, 0], [1.05, 0.9, 1.1]));
  head.add(ball(0.3, M.body, [0, -0.12, 0.42], [1.05, 0.75, 0.9])); // snout
  for (const s of [-1, 1]) head.add(ball(0.025, M.dark, [s * 0.08, -0.06, 0.69], [1.2, 0.8, 0.6], 10)); // nostrils

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 20, Math.PI), M.dark);
  smile.rotation.set(-0.25, 0, Math.PI);
  smile.position.set(0, -0.2, 0.64);
  head.add(smile);
  // handlebar mustache under the nose, tips curling up
  const stache = new THREE.MeshPhysicalMaterial({
    color: colors.mustache ?? 0,
    roughness: 0.5,
    sheen: 1,
    sheenColor: new THREE.Color(0x8a6a50),
  });
  for (const s of colors.mustache === null ? [] : [-1, 1]) {
    const half = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.12, 0.69),
      new THREE.Vector3(s * 0.11, -0.15, 0.66),
      new THREE.Vector3(s * 0.21, -0.15, 0.58),
      new THREE.Vector3(s * 0.27, -0.08, 0.5),
    ]);
    head.add(
      new THREE.Mesh(
        taperedTube(half, t => 0.042 * (1 - t * 0.8) + 0.008, { segments: 24, radial: 10 }),
        stache,
      ),
    );
  }

  const mouth = new THREE.Group();
  mouth.position.set(0, -0.24, 0.62);
  mouth.add(ball(0.09, matte(0x3a1a2a), [0, 0, 0], [1.1, 0.9, 0.5]));
  mouth.add(ball(0.055, matte(0xff7a93), [0, -0.035, 0.03], [1.2, 0.6, 0.4]));
  mouth.visible = false;
  head.add(mouth);

  const eyes: THREE.Group[] = [];
  const cheeks: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.22, 0.1, 0.42);
    eye.rotation.y = s * 0.3;
    eye.add(
      ball(
        0.13,
        new THREE.MeshPhysicalMaterial({ color: colors.eyes, roughness: 0.15, clearcoat: 1 }),
        [0, 0, 0],
        [1, 1.1, 0.6],
      ),
    ); // iris
    eye.add(ball(0.07, M.eye, [0, -0.005, 0.045], [1, 1.1, 0.5])); // pupil
    eye.add(ball(0.042, M.shine, [0.035, 0.045, 0.075], [1, 1, 0.4], 12));
    eye.add(ball(0.018, M.shine, [-0.03, -0.035, 0.075], [1, 1, 0.4], 12));
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.08, M.cheek, [s * 0.33, -0.1, 0.38], [1, 0.7, 0.35]) as THREE.Mesh;
    head.add(cheek);
    cheeks.push(cheek);
  }
  torso.add(head);

  // red bow tie under the chin
  const bow = new THREE.Group();
  bow.position.set(0, 1.62, 1.0);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), M.bow);
    wing.rotation.z = (s * Math.PI) / 2;
    wing.position.x = s * 0.1;
    wing.scale.set(1, 1, 0.5);
    bow.add(wing);
  }
  bow.add(ball(0.045, M.bow, [0, 0, 0.02]));
  torso.add(bow);

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
    plates,
    setMouth(k) {
      smile.visible = k < 0.05;
      mouth.visible = k >= 0.05;
      mouth.scale.set(0.6 + 0.4 * k, k, 1);
    },
    setFrown(on) {
      smile.rotation.z = on ? 0 : Math.PI;
      smile.position.y = on ? -0.29 : -0.2;
    },
  };
}
